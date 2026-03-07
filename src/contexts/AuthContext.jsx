import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getAuthCallbackUrl } from '../lib/domainResolver'

const AuthContext = createContext(null)
const AUTH_TIMEOUT_MS = 8000

function withTimeout(promise, ms, message) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(message)), ms)
        promise
            .then((value) => {
                clearTimeout(timer)
                resolve(value)
            })
            .catch((err) => {
                clearTimeout(timer)
                reject(err)
            })
    })
}

function getAuthRedirectUrl() {
    const explicitRedirect = import.meta.env.VITE_AUTH_REDIRECT_URL
    if (explicitRedirect) return explicitRedirect

    return getAuthCallbackUrl()
}

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
    const [accountsLoaded, setAccountsLoaded] = useState(false)

    // Initialize auth state
    useEffect(() => {
        let isActive = true

        const initSession = async () => {
            try {
                const { data, error } = await withTimeout(
                    supabase.auth.getSession(),
                    AUTH_TIMEOUT_MS,
                    'Timed out loading session'
                )
                if (error) throw error

                const session = data?.session ?? null
                if (!isActive) return

                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    await fetchUserAccounts(session.user.id)
                } else {
                    setAccounts([])
                    setCurrentAccount(null)
                    setAccountsLoaded(true)
                    setLoading(false)
                }
            } catch (err) {
                console.error('Failed to load auth session:', err)
                if (!isActive) return
                setSession(null)
                setUser(null)
                setAccounts([])
                setCurrentAccount(null)
                setAccountsLoaded(true)
                setLoading(false)
            } finally {
                if (isActive) setInitialized(true)
            }
        }

        initSession()

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
                    setAccountsLoaded(true)
                    setLoading(false)
                }
            }
        )

        return () => {
            isActive = false
            subscription.unsubscribe()
        }
    }, [])

    // Fetch user's accounts
    const fetchUserAccounts = async (userId) => {
        try {
            const { data, error } = await withTimeout(
                supabase
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
                    .eq('user_id', userId),
                AUTH_TIMEOUT_MS,
                'Timed out loading accounts'
            )

            if (error) {
                console.error('Failed to fetch accounts:', error)
                setAccounts([])
                setAccountsLoaded(true)
                setLoading(false)
                return
            }

            const userAccounts = (data || [])
                .filter(m => m.account)
                .map(m => ({ ...m.account, role: m.role }))

            // No accounts found — auto-create a default one so the user
            // is never stuck on the onboarding screen unnecessarily.
            if (userAccounts.length === 0) {
                try {
                    const { data: userData } = await supabase.auth.getUser()
                    const email = userData?.user?.email || 'user@example.com'
                    const namePart = email.split('@')[0]
                    const slug = namePart.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
                        + '-' + userId.slice(0, 8)

                    const { data: newAccount, error: acctErr } = await supabase
                        .from('accounts')
                        .insert({ name: namePart, slug })
                        .select()
                        .single()

                    if (!acctErr && newAccount) {
                        await supabase
                            .from('account_members')
                            .insert({ account_id: newAccount.id, user_id: userId, role: 'owner' })

                        const enriched = { ...newAccount, role: 'owner' }
                        setAccounts([enriched])
                        setCurrentAccount(enriched)
                        localStorage.setItem('currentAccountId', enriched.id)
                        return
                    }

                    // Insert failed (e.g. slug conflict from a concurrent call) —
                    // retry the fetch so we pick up whatever was just created.
                    const { data: retryData } = await supabase
                        .from('account_members')
                        .select(`role, account:accounts (id, name, slug, logo_url, is_published, custom_domain)`)
                        .eq('user_id', userId)
                    const retryAccounts = (retryData || [])
                        .filter(m => m.account)
                        .map(m => ({ ...m.account, role: m.role }))
                    if (retryAccounts.length > 0) {
                        setAccounts(retryAccounts)
                        const savedId = localStorage.getItem('currentAccountId')
                        setCurrentAccount(retryAccounts.find(a => a.id === savedId) || retryAccounts[0])
                        return
                    }
                } catch (autoErr) {
                    console.error('Auto-create account failed:', autoErr)
                }
            }

            setAccounts(userAccounts)

            // Restore last selected account from localStorage
            const savedAccountId = localStorage.getItem('currentAccountId')
            const savedAccount = userAccounts.find(a => a.id === savedAccountId)
            setCurrentAccount(savedAccount || userAccounts[0] || null)
        } catch (err) {
            console.error('Failed to fetch accounts:', err)
            setAccounts([])
        } finally {
            setAccountsLoaded(true)
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
                emailRedirectTo: getAuthRedirectUrl(),
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
                redirectTo: getAuthRedirectUrl()
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
        accountsLoaded,

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
