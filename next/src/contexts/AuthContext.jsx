'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { authClient } from '../lib/auth/client'
import { accountsApi } from '../lib/api'
import { getAuthCallbackUrl } from '../lib/domainResolver'

/**
 * Auth + account context.
 *
 * The PUBLIC SURFACE of this provider is deliberately unchanged from the
 * Supabase version — same state keys, same method names, same `{ data, error }`
 * returns — so gates.jsx and every consumer compile untouched. Only the
 * internals moved to Better Auth.
 *
 * Two things from the old implementation are gone on purpose:
 *
 *  - onAuthStateChange, and with it the `setTimeout(..., 0)` workaround whose
 *    comment explained that calling another supabase method synchronously
 *    inside the callback holds the client lock and can deadlock. Better Auth's
 *    useSession is a plain reactive hook with no such lock, so the workaround
 *    deletes itself rather than being ported.
 *
 *  - the 20s withTimeout wrapper around getSession. Session resolution is now
 *    a same-origin request to our own /api/auth, not a cross-region call that
 *    could hang indefinitely; fetch failures surface as errors already.
 */

const AuthContext = createContext(null)

function getAuthRedirectUrl() {
    const explicitRedirect = process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL
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
    const { data: sessionData, isPending } = authClient.useSession()

    const [accounts, setAccounts] = useState([])
    const [currentAccount, setCurrentAccount] = useState(null)
    const [accountsLoaded, setAccountsLoaded] = useState(false)

    const user = sessionData?.user ?? null
    const session = sessionData?.session ?? null
    const userId = user?.id ?? null

    // Guards against re-fetching accounts for a user we already loaded (the
    // session hook re-renders on refresh/refocus).
    const loadedUserRef = useRef(null)

    const fetchUserAccounts = useCallback(async (uid, { force = false } = {}) => {
        if (!uid) return
        if (!force && loadedUserRef.current === uid) return
        loadedUserRef.current = uid

        const { data, error } = await accountsApi.list()

        if (error) {
            console.error('Failed to fetch accounts:', error.message)
            // Deliberately does NOT clear existing accounts — a transient
            // failure should not log the user out of their workspace.
            setAccountsLoaded(true)
            return
        }

        let userAccounts = data ?? []

        /**
         * Auto-create a first workspace so a new user is never stranded on an
         * empty dashboard. Skipped on the invite page, where the user is about
         * to join someone else's account and a stray personal one would be
         * confusing.
         */
        const onInvitePage =
            typeof window !== 'undefined' && window.location.pathname.startsWith('/invite/')

        if (userAccounts.length === 0 && !onInvitePage) {
            const email = user?.email || 'user@example.com'
            const namePart = email.split('@')[0]
            const slug =
                namePart.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) + '-' + uid.slice(0, 8)

            const { data: created, error: createErr } = await accountsApi.create({
                name: namePart,
                slug,
            })

            if (created) {
                userAccounts = [created]
            } else if (createErr?.code === 'duplicate') {
                // A concurrent tab already created it — re-read rather than
                // surfacing an error the user cannot act on.
                const retry = await accountsApi.list()
                userAccounts = retry.data ?? []
            } else if (createErr) {
                console.error('Auto-create account failed:', createErr.message)
            }
        }

        setAccounts(userAccounts)

        const savedId = safeGetItem('currentAccountId')
        setCurrentAccount(userAccounts.find((a) => a.id === savedId) || userAccounts[0] || null)
        setAccountsLoaded(true)
    }, [user?.email])

    useEffect(() => {
        if (isPending) return

        if (!userId) {
            loadedUserRef.current = null
            setAccounts([])
            setCurrentAccount(null)
            setAccountsLoaded(true)
            return
        }

        fetchUserAccounts(userId)
    }, [isPending, userId, fetchUserAccounts])

    const switchAccount = (accountId) => {
        const account = accounts.find((a) => a.id === accountId)
        if (account) {
            setCurrentAccount(account)
            safeSetItem('currentAccountId', accountId)
        }
    }

    /* ── auth methods (shape-compatible with the supabase versions) ───── */

    const signUp = async (email, password, fullName) => {
        const { data, error } = await authClient.signUp.email({
            email,
            password,
            name: fullName || email.split('@')[0],
            fullName,
            callbackURL: getAuthRedirectUrl(),
        })
        return { data, error }
    }

    const signIn = async (email, password) => {
        const { data, error } = await authClient.signIn.email({ email, password })
        return { data, error }
    }

    const signInWithOAuth = async (provider) => {
        const { data, error } = await authClient.signIn.social({
            provider,
            callbackURL: getAuthRedirectUrl(),
        })
        return { data, error }
    }

    const signOut = async () => {
        const { error } = await authClient.signOut()
        if (!error) {
            safeRemoveItem('currentAccountId')
            loadedUserRef.current = null
            setAccounts([])
            setCurrentAccount(null)
        }
        return { error }
    }

    /* ── account methods ──────────────────────────────────────────────── */

    const createAccount = async (name, slug) => {
        const { data, error } = await accountsApi.create({ name, slug })
        if (error) return { data: null, error }
        // force: the membership set changed, so the cache guard must not skip.
        await fetchUserAccounts(userId, { force: true })
        return { data, error: null }
    }

    const updateAccount = async (accountId, patch) => {
        const { data, error } = await accountsApi.update(accountId, patch)
        if (error) return { data: null, error }
        await fetchUserAccounts(userId, { force: true })
        return { data, error: null }
    }

    /**
     * Account deletion has no API route yet — the server-side cascade
     * (brands -> collections -> assets -> R2 objects) is Phase 6/7 work and
     * doing it half-way would orphan files in storage. Kept in the surface so
     * callers still compile, but it fails loudly rather than pretending.
     */
    const deleteAccount = async () => ({
        error: { message: 'Deleting an account is not available yet', code: 'not_implemented' },
    })

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
        loading: isPending,
        // Better Auth resolves the session before first paint, so there is no
        // separate "initialized" phase; kept so gates.jsx is untouched.
        initialized: !isPending,
        accountsLoaded,

        // Auth methods
        signUp,
        signIn,
        signInWithOAuth,
        signOut,

        // Account methods
        switchAccount,
        createAccount,
        updateAccount,
        deleteAccount,
        refreshAccounts: () => userId && fetchUserAccounts(userId, { force: true }),

        // Permission helpers
        hasRole,
        isOwner: () => hasRole('owner'),
        isEditor: () => hasRole('editor'),
        isViewer: () => hasRole('viewer'),
        canEdit: () => hasRole('editor'),
        canManage: () => hasRole('owner'),
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* localStorage is unavailable during SSR and in privacy modes. */
function safeGetItem(k) {
    try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null } catch { return null }
}
function safeSetItem(k, v) {
    try { localStorage.setItem(k, v) } catch { /* ignore */ }
}
function safeRemoveItem(k) {
    try { localStorage.removeItem(k) } catch { /* ignore */ }
}

export default AuthContext
