import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [session, setSession] = useState(null)
    const [accounts, setAccounts] = useState([])
    const [currentAccount, setCurrentAccount] = useState(null)
    const [loading, setLoading] = useState(true)
    const [initialized, setInitialized] = useState(false)

    // Initialize auth state
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchUserAccounts(session.user.id)
            } else {
                setLoading(false)
            }
            setInitialized(true)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    await fetchUserAccounts(session.user.id)
                } else {
                    setAccounts([])
                    setCurrentAccount(null)
                    setLoading(false)
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    // Fetch user's accounts
    const fetchUserAccounts = async (userId) => {
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
                console.error('Failed to fetch accounts:', error)
                setAccounts([])
                setLoading(false)
                return
            }

            const userAccounts = (data || [])
                .filter(m => m.account) // Filter out null accounts
                .map(m => ({
                    ...m.account,
                    role: m.role
                }))

            setAccounts(userAccounts)

            // Set current account (first one or from localStorage)
            const savedAccountId = localStorage.getItem('currentAccountId')
            const savedAccount = userAccounts.find(a => a.id === savedAccountId)
            setCurrentAccount(savedAccount || userAccounts[0] || null)
        } catch (err) {
            console.error('Failed to fetch accounts:', err)
            setAccounts([])
        } finally {
            setLoading(false)
        }
    }

    // Switch to a different account
    const switchAccount = (accountId) => {
        const account = accounts.find(a => a.id === accountId)
        if (account) {
            setCurrentAccount(account)
            localStorage.setItem('currentAccountId', accountId)
        }
    }

    // Sign up with email/password
    const signUp = async (email, password, fullName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        })
        return { data, error }
    }

    // Sign in with email/password
    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        return { data, error }
    }

    // Sign in with OAuth (Google, GitHub, etc.)
    const signInWithOAuth = async (provider) => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        })
        return { data, error }
    }

    // Sign out
    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (!error) {
            localStorage.removeItem('currentAccountId')
        }
        return { error }
    }

    // Create a new account (for new users or adding accounts)
    const createAccount = async (name, slug) => {
        try {
            // Create account
            const { data: account, error: accountError } = await supabase
                .from('accounts')
                .insert({ name, slug })
                .select()
                .single()

            if (accountError) throw accountError

            // Add current user as owner
            const { error: memberError } = await supabase
                .from('account_members')
                .insert({
                    account_id: account.id,
                    user_id: user.id,
                    role: 'owner'
                })

            if (memberError) throw memberError

            // Refresh accounts list
            await fetchUserAccounts(user.id)

            return { data: account, error: null }
        } catch (err) {
            return { data: null, error: err }
        }
    }

    // Check if user has a specific role in current account
    const hasRole = (requiredRole) => {
        if (!currentAccount) return false
        const roleHierarchy = { owner: 3, editor: 2, viewer: 1 }
        const userLevel = roleHierarchy[currentAccount.role] || 0
        const requiredLevel = roleHierarchy[requiredRole] || 0
        return userLevel >= requiredLevel
    }

    const value = {
        // State
        user,
        session,
        accounts,
        currentAccount,
        loading,
        initialized,

        // Auth methods
        signUp,
        signIn,
        signInWithOAuth,
        signOut,

        // Account methods
        switchAccount,
        createAccount,
        refreshAccounts: () => user && fetchUserAccounts(user.id),

        // Permission helpers
        hasRole,
        isOwner: () => hasRole('owner'),
        isEditor: () => hasRole('editor'),
        isViewer: () => hasRole('viewer'),
        canEdit: () => hasRole('editor'), // editor or above
        canManage: () => hasRole('owner')  // owner only
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext
