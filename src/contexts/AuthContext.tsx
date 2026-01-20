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

    useEffect(() => {
        console.log('AuthContext: loading state changed:', loading)
    }, [loading])

    // Legacy state (maps to workspaces)
    const accounts = workspaces as unknown as Account[]
    const currentAccount = currentWorkspace as unknown as Account | null

    // Fetch user's workspaces
    const fetchWorkspaces = async (userId: string) => {
        console.log('AuthContext: fetchWorkspaces started', userId)
        try {
            const { data, error } = await supabase
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

            if (error || !data || data.length === 0) {
                // Fallback to old account_members table if workspaces don't exist yet
                console.log('Workspaces not found, trying legacy accounts...')
                return fetchLegacyAccounts(userId)
            }

            const userWorkspaces = (data || [])
                .filter(m => m.workspace)
                .map(m => ({
                    ...(m.workspace as any),
                    role: m.role,
                    can_invite: m.can_invite,
                    brand_access_type: m.brand_access_type
                })) as Workspace[]

            setWorkspaces(userWorkspaces)

            // Set current workspace (first one or from localStorage)
            const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')
            const savedWorkspace = userWorkspaces.find(w => w.id === savedWorkspaceId)
            setCurrentWorkspace(savedWorkspace || userWorkspaces[0] || null)
        } catch (err) {
            console.error('Failed to fetch workspaces:', err)
            setWorkspaces([])
        }
    }



    // Legacy: Fetch accounts (fallback)
    const fetchLegacyAccounts = async (userId: string) => {
        console.log('AuthContext: fetchLegacyAccounts started')
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

            if (error) {
                console.error('Failed to fetch accounts:', error.message)
                setWorkspaces([])
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

            // Set current workspace
            const savedId = localStorage.getItem('currentWorkspaceId') || localStorage.getItem('currentAccountId')
            const saved = userAccounts.find(a => a.id === savedId)
            setCurrentWorkspace(saved || userAccounts[0] || null)
        } catch (err) {
            console.error('Failed to fetch accounts:', err)
            setWorkspaces([])
        }
    }

    useEffect(() => {
        console.log('AuthContext: Initializing...')
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('AuthContext: getSession result', session?.user?.email)
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                console.log('AuthContext: User found, fetching workspaces...')
                fetchWorkspaces(session.user.id).then(() => {
                    console.log('AuthContext: fetchWorkspaces done (initial)')
                    setLoading(false)
                })
            } else {
                console.log('AuthContext: No user, stopping loading')
                setLoading(false)
            }
        }).catch(err => {
            console.error('AuthContext: getSession error', err)
            setLoading(false)
        })


        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('AuthContext: onAuthStateChange', event, session?.user?.email)
                setSession(session)
                setUser(session?.user ?? null)
                if (session?.user) {
                    await fetchWorkspaces(session.user.id)
                } else {
                    setWorkspaces([])
                    setCurrentWorkspace(null)
                }
                console.log('AuthContext: onAuthStateChange done, stopping loading')
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
