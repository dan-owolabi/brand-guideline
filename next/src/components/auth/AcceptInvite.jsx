'use client'

/**
 * Accept Invite Page
 * 
 * Handles /invite/:token route for accepting team invitations
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from '@/compat/router'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Loader2, CheckCircle, XCircle, Users, ArrowRight } from 'lucide-react'

export default function AcceptInvite() {
    const { token } = useParams()
    const navigate = useNavigate()
    const { user, loading: authLoading, initialized, refreshAccounts, switchAccount } = useAuth()
    const [invite, setInvite] = useState(null)
    const [loading, setLoading] = useState(true)
    const [accepting, setAccepting] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    // Load invite details
    const loadInvite = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('account_invites')
                .select(`
                    *,
                    account:accounts (
                        id,
                        name,
                        logo_url
                    )
                `)
                .eq('token', token)
                .single()

            if (fetchError || !data) {
                setError('This invite link is invalid or has already been used.')
                return
            }

            if (data.status !== 'pending') {
                setError('This invite has already been accepted or has expired.')
                return
            }

            if (new Date(data.expires_at) < new Date()) {
                setError('This invite has expired. Please ask the team owner for a new invite.')
                return
            }

            setInvite(data)
        } catch (err) {
            console.error('Failed to load invite:', err)
            setError('Failed to load invite details.')
        } finally {
            setLoading(false)
        }
    }, [token])

    const handleAccept = useCallback(async () => {
        if (!user) return

        setAccepting(true)
        try {
            const { data, error: rpcError } = await supabase.rpc('accept_invite', {
                invite_token: token
            })

            if (rpcError) throw rpcError

            if (data?.error) {
                setError(data.error)
                return
            }

            setSuccess(true)

            // Refresh accounts and switch to the invited workspace, then redirect
            setTimeout(async () => {
                await refreshAccounts()
                if (data?.account_id) switchAccount(data.account_id)
                navigate('/dashboard', { replace: true })
            }, 2000)
        } catch (err) {
            console.error('Failed to accept invite:', err)
            setError('Failed to accept the invite. Please try again.')
        } finally {
            setAccepting(false)
        }
    }, [navigate, refreshAccounts, switchAccount, token, user])

    useEffect(() => {
        if (!token) return
        loadInvite()
    }, [loadInvite, token])

    // Auto-accept if user is logged in and invite is loaded
    useEffect(() => {
        if (user && invite && !accepting && !success && !error) {
            handleAccept()
        }
    }, [accepting, error, handleAccept, invite, success, user])

    // Loading state
    if (loading || (authLoading && !initialized)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Loading invite...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-sm mx-auto text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Invite Error</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-sm mx-auto text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">You're in!</h1>
                    <p className="text-gray-600 mb-2">
                        You've joined <strong>{invite?.account?.name}</strong> as {invite?.role === 'editor' ? 'an' : 'a'} {invite?.role}.
                    </p>
                    <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
                </div>
            </div>
        )
    }

    // Not logged in - show invite details and prompt to sign up/login
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-sm mx-auto text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-6 h-6 text-purple-500" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">You're Invited!</h1>
                    <p className="text-gray-600 mb-6">
                        You've been invited to join <strong>{invite?.account?.name}</strong> as {invite?.role === 'editor' ? 'an' : 'a'} <strong>{invite?.role}</strong>.
                    </p>
                    <div className="space-y-3">
                        <Link
                            to={`/signup?redirect=${encodeURIComponent(`/invite/${token}`)}`}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Create Account
                            <ArrowRight size={16} />
                        </Link>
                        <Link
                            to={`/login?redirect=${encodeURIComponent(`/invite/${token}`)}`}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // Logged in, accepting in progress
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Accepting invite...</p>
            </div>
        </div>
    )
}