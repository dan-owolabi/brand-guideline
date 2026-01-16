/**
 * Authenticated App Shell
 * 
 * Dashboard, editor, and settings for app.guidr.space
 * Requires authentication
 */
import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import BrandsDashboard from './admin/BrandsDashboard'
import BrandCanvas from './BrandCanvas'
import AssetsPage from './admin/AssetsPage'
import LoginPage from './auth/LoginPage'
import SignupPage from './auth/SignupPage'
import OnboardingFlow from './auth/OnboardingFlow'
import AccountSettings from './settings/AccountSettings'
import { Loader2 } from 'lucide-react'

export default function AuthenticatedApp() {
    const { user, accounts, loading, initialized } = useAuth()

    // TEMP: Skip loading check to debug
    // if (!initialized || loading) {
    //     return (
    //         <div className="min-h-screen flex items-center justify-center bg-gray-50">
    //             <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    //         </div>
    //     )
    // }

    return (
        <Routes>
            {/* Public auth routes (no login required) */}
            <Route path="/login" element={
                user ? <Navigate to="/dashboard" replace /> : <LoginPage />
            } />
            <Route path="/signup" element={
                user ? <Navigate to="/dashboard" replace /> : <SignupPage />
            } />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Onboarding for users without accounts */}
            <Route path="/onboarding" element={
                <RequireAuth>
                    {accounts.length === 0 ? <OnboardingFlow /> : <Navigate to="/dashboard" replace />}
                </RequireAuth>
            } />

            {/* Protected routes (require login) */}
            <Route path="/dashboard" element={
                <RequireAuth>
                    <BrandsDashboard />
                </RequireAuth>
            } />
            <Route path="/brand/:brandId/assets" element={
                <RequireAuth>
                    <RequireAccount>
                        <AssetsPage />
                    </RequireAccount>
                </RequireAuth>
            } />
            <Route path="/brand/:brandId/:pageSlug" element={
                <RequireAuth>
                    <RequireAccount>
                        <BrandCanvasWrapper />
                    </RequireAccount>
                </RequireAuth>
            } />
            <Route path="/brand/:brandId" element={
                <RequireAuth>
                    <Navigate to="introduction" replace />
                </RequireAuth>
            } />
            <Route path="/settings" element={
                <RequireAuth>
                    <RequireAccount>
                        <AccountSettings />
                    </RequireAccount>
                </RequireAuth>
            } />
            <Route path="/settings/:tab" element={
                <RequireAuth>
                    <RequireAccount>
                        <AccountSettings />
                    </RequireAccount>
                </RequireAuth>
            } />

            {/* Default redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    )
}

/**
 * Higher-order component to protect routes - requires authentication
 */
function RequireAuth({ children }) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (!user) {
        // Redirect to login with return URL
        return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
    }

    return children
}

/**
 * Higher-order component to require an account - redirects to onboarding if none
 */
function RequireAccount({ children }) {
    const { accounts, loading, initialized } = useAuth()

    // Still loading auth state
    if (!initialized || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    // No accounts - redirect to onboarding
    if (accounts.length === 0) {
        return <Navigate to="/onboarding" replace />
    }

    return children
}

/**
 * OAuth callback handler
 */
function AuthCallback() {
    const { loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Completing sign in...</p>
                </div>
            </div>
        )
    }

    return <Navigate to="/dashboard" replace />
}

/**
 * Brand canvas wrapper for authenticated editing
 */
function BrandCanvasWrapper() {
    const { brandId } = useParams()
    const { currentAccount, canEdit } = useAuth()
    const [brandData, setBrandData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadBrand()
    }, [brandId, currentAccount])

    const loadBrand = async () => {
        if (!brandId) {
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('brands')
                .select('id, name, logo_url, primary_color, published, draft, slug, account_id')
                .eq('id', brandId)
                .single()

            if (error) throw error

            // Verify brand belongs to current account
            if (currentAccount && data.account_id !== currentAccount.id) {
                console.error('Brand does not belong to current account')
                setBrandData(null)
                return
            }

            setBrandData({
                brandId: data.id,
                name: data.name,
                slug: data.slug,
                logoUrl: data.logo_url,
                primaryColor: data.primary_color,
                published: data.published || { tokens: {}, sections: [] },
                draft: data.draft || { tokens: {}, sections: [] }
            })
        } catch (err) {
            console.error('Failed to load brand:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (!brandData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Brand not found</h1>
                    <p className="text-gray-500 mb-4">This brand doesn't exist or you don't have access.</p>
                    <a href="/dashboard" className="text-indigo-600 hover:underline">
                        Go to Dashboard
                    </a>
                </div>
            </div>
        )
    }

    return <BrandCanvas isAdmin={canEdit()} brandData={brandData} />
}
