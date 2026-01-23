'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'

// NEW: Workspace-based types
export interface Workspace {
    id: string
    name: string
    slug: string
    logo_url?: string
    owner_id: string
    role: 'owner' | 'editor' | 'viewer'
    can_invite: boolean
    brand_access_type: 'all' | 'specific'
}

export interface BrandPermission {
    brand_id: string
    permission: 'none' | 'view' | 'edit'
}

// Legacy: Keep Account interface for backward compatibility during migration
interface Account {
    id: string
    name: string
    slug: string
    logo_url?: string
    is_published?: boolean
    custom_domain?: string
    role?: 'owner' | 'editor' | 'viewer'
}

interface AuthContextType {
    user: User | null
    session: Session | null
    // NEW: Workspace system
    workspaces: Workspace[]
    currentWorkspace: Workspace | null
    switchWorkspace: (workspaceId: string) => void
    createWorkspace: (name: string, slug: string) => Promise<{ data: Workspace | null, error: Error | null }>
    refreshWorkspaces: () => Promise<void>
    // Legacy: Keep for backward compatibility
    accounts: Account[]
    currentAccount: Account | null
    loading: boolean
    workspacesLoading: boolean
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>
    signInWithOAuth: (provider: 'google') => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
    switchAccount: (accountId: string) => void
    createAccount: (name: string, slug: string) => Promise<{ data: Account | null, error: Error | null }>
    refreshAccounts: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
    const [loading, setLoading] = useState(true)
    const [workspacesLoading, setWorkspacesLoading] = useState(true)

    // Legacy state (maps to workspaces)
    const accounts = workspaces as unknown as Account[]
    const currentAccount = currentWorkspace as unknown as Account | null

    // Fetch user's workspaces
    const fetchWorkspaces = async (userId: string) => {
        setWorkspacesLoading(true)
        try {
            console.log('AuthContext: Fetching workspaces for user', userId)

            // Try RPC first with timeout (more efficient and bypasses RLS recursion)
            let rpcSuccess = false
            try {
                // Add timeout to prevent indefinite hanging
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('RPC timeout')), 5000)
                )
                const rpcPromise = supabase.rpc('get_user_workspaces')

                const { data: rpcData, error: rpcError } = await Promise.race([
                    rpcPromise,
                    timeoutPromise
                ]) as any

                console.log('AuthContext: RPC result', { rpcData, rpcError })

                if (!rpcError && rpcData && Array.isArray(rpcData)) {
                    console.log('AuthContext: RPC fetch success', rpcData.length, 'workspaces')
                    const mappedWorkspaces = rpcData.map((w: any) => ({
                        id: w.workspace_id,
                        name: w.workspace_name,
                        slug: w.workspace_slug,
                        logo_url: undefined,
                        owner_id: w.is_owner ? userId : 'unknown',
                        role: w.role,
                        can_invite: w.role === 'owner',
                        brand_access_type: 'all'
                    })) as Workspace[]

                    setWorkspaces(mappedWorkspaces)
                    rpcSuccess = true
                } else {
                    console.log('AuthContext: RPC failed or returned empty', rpcError?.message)
                }
            } catch (rpcErr) {
                console.log('AuthContext: RPC threw error or timed out, falling back', rpcErr)
            }

            // Only try fallbacks if RPC didn't succeed
            if (rpcSuccess) {
                return
            }

            // Fallback: Try workspace_members table with timeout
            console.log('AuthContext: Trying workspace_members table...')
            try {
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('workspace_members query timeout')), 5000)
                )
                const membersPromise = supabase
                    .from('workspace_members')
                    .select(`
                        role,
                        can_invite,
                        brand_access_type,
                        workspace:workspaces (
                            id,
                            name,
                            slug,
                            logo_url,
                            owner_id
                        )
                    `)
                    .eq('user_id', userId)

                const { data, error } = await Promise.race([
                    membersPromise,
                    timeoutPromise
                ]) as any

                console.log('AuthContext: workspace_members result', { count: data?.length, error: error?.message })

                if (!error && data && data.length > 0) {
                    const userWorkspaces = data
                        .filter((m: any) => m.workspace)
                        .map((m: any) => ({
                            ...(m.workspace as any),
                            role: m.role,
                            can_invite: m.can_invite,
                            brand_access_type: m.brand_access_type
                        })) as Workspace[]

                    setWorkspaces(userWorkspaces)
                    return
                }
            } catch (membersErr) {
                console.log('AuthContext: workspace_members query failed or timed out, trying legacy...', membersErr)
            }

            // Final fallback: legacy accounts
            console.log('AuthContext: Trying legacy accounts...')
            await fetchLegacyAccounts(userId)

        } catch (err) {
            console.error('AuthContext: fetchWorkspaces failed:', err)
            setWorkspaces([])
        } finally {
            // ALWAYS set loading to false
            console.log('AuthContext: fetchWorkspaces complete, setting workspacesLoading=false')
            setWorkspacesLoading(false)
        }
    }

    // Legacy: Fetch accounts (fallback)
    const fetchLegacyAccounts = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('account_members')
                .select(`
                    role,
                    account:accounts (
                        id,
                        name,
                        slug,
                        logo_url,
                        is_published,
                        custom_domain
                    )
                `)
                .eq('user_id', userId)

            console.log('AuthContext: fetchLegacyAccounts result', { data, error })

            if (error) {
                console.error('Failed to fetch accounts:', error.message)
                setWorkspaces([])
                setWorkspacesLoading(false)
                return
            }

            const userAccounts = (data || [])
                .filter(m => m.account)
                .map(m => ({
                    ...(m.account as any),
                    role: m.role,
                    can_invite: m.role === 'owner',
                    brand_access_type: 'all' as const
                })) as Workspace[]

            setWorkspaces(userAccounts)
            setWorkspacesLoading(false)
        } catch (err) {
            console.error('Failed to fetch accounts:', err)
            setWorkspaces([])
            setWorkspacesLoading(false)
        }
    }

    // USER REQUESTED: Reactive Workspace Restoration
    useEffect(() => {
        if (workspacesLoading) return
        if (!workspaces || workspaces.length === 0) return

        const savedWorkspaceId = localStorage.getItem("currentWorkspaceId")

        if (savedWorkspaceId) {
            const matched = workspaces.find(w => w.id === savedWorkspaceId)
            if (matched) {
                console.log('AuthContext: Restoring workspace from storage:', matched.name)
                setCurrentWorkspace(matched)
                return
            }
        }

        // Fallback: pick first workspace
        console.log('AuthContext: Defaulting to first workspace:', workspaces[0].name)
        setCurrentWorkspace(workspaces[0])
        localStorage.setItem("currentWorkspaceId", workspaces[0].id)
    }, [workspacesLoading, workspaces])

    useEffect(() => {
        console.log('AuthContext: Initializing auth...')
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('AuthContext: getSession result', { hasSession: !!session, userId: session?.user?.id })
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                console.log('AuthContext: User found, calling fetchWorkspaces...')
                fetchWorkspaces(session.user.id).then(() => {
                    console.log('AuthContext: fetchWorkspaces promise resolved, setting loading=false')
                    setLoading(false)
                })
            } else {
                console.log('AuthContext: No session, setting loading=false')
                setLoading(false)
                setWorkspacesLoading(false) // Also set workspacesLoading false if no user
            }
        }).catch((err) => {
            console.error('AuthContext: getSession failed', err)
            setLoading(false)
            setWorkspacesLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session)
                setUser(session?.user ?? null)
                if (session?.user) {
                    await fetchWorkspaces(session.user.id)
                } else {
                    setWorkspaces([])
                    setCurrentWorkspace(null)
                }
                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error as Error | null }
    }

    const signUp = async (email: string, password: string, fullName?: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        })
        return { error: error as Error | null }
    }

    const signInWithOAuth = async (provider: 'google') => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        })
        return { error: error as Error | null }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setWorkspaces([])
        setCurrentWorkspace(null)
        localStorage.removeItem('currentWorkspaceId')
        localStorage.removeItem('currentAccountId')
        // Redirect to login page
        window.location.href = '/login'
    }

    const switchWorkspace = (workspaceId: string) => {
        const workspace = workspaces.find(w => w.id === workspaceId)
        if (workspace) {
            setCurrentWorkspace(workspace)
            localStorage.setItem('currentWorkspaceId', workspaceId)
        }
    }

    // Legacy: switchAccount maps to switchWorkspace
    const switchAccount = switchWorkspace

    const createWorkspace = async (name: string, slug: string): Promise<{ data: Workspace | null, error: Error | null }> => {
        if (!user) return { data: null, error: new Error('Not authenticated') }

        try {
            const { data: workspace, error: insertError } = await supabase
                .from('workspaces')
                .insert({
                    name,
                    slug,
                    owner_id: user.id
                })
                .select()
                .single()

            if (insertError) throw insertError

            // Refresh workspaces to include the new one
            await fetchWorkspaces(user.id)

            return { data: workspace as Workspace, error: null }
        } catch (err: any) {
            console.error('Failed to create workspace:', err.message)
            return { data: null, error: err }
        }
    }

    // Legacy: createAccount tries new system first, falls back to old
    const createAccount = async (name: string, slug: string): Promise<{ data: Account | null, error: Error | null }> => {
        if (!user) return { data: null, error: new Error('Not authenticated') }

        try {
            // Try new workspaces table first
            const { data: workspace, error: wsError } = await supabase
                .from('workspaces')
                .insert({
                    name,
                    slug,
                    owner_id: user.id
                })
                .select()
                .single()

            if (!wsError && workspace) {
                await fetchWorkspaces(user.id)
                return { data: workspace as Account, error: null }
            }

            // Fallback to old accounts table
            const { data: account, error: accError } = await supabase
                .from('accounts')
                .insert({ name, slug })
                .select()
                .single()

            if (accError) throw accError

            // Create membership
            await supabase
                .from('account_members')
                .insert({
                    account_id: account.id,
                    user_id: user.id,
                    role: 'owner'
                })

            await fetchWorkspaces(user.id)
            return { data: account as Account, error: null }
        } catch (err: any) {
            console.error('Failed to create account:', err.message)
            return { data: null, error: err }
        }
    }

    const refreshWorkspaces = async () => {
        if (user) await fetchWorkspaces(user.id)
    }

    const refreshAccounts = refreshWorkspaces

    return (
        <AuthContext.Provider value={{
            user,
            session,
            workspaces,
            currentWorkspace,
            switchWorkspace,
            createWorkspace,
            refreshWorkspaces,
            // Legacy compatibility
            accounts,
            currentAccount,
            loading,
            workspacesLoading,
            signIn,
            signUp,
            signInWithOAuth,
            signOut,
            switchAccount,
            createAccount,
            refreshAccounts
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
