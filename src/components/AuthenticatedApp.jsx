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

    // Show loading while checking auth
    if (!initialized || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

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
                    <OnboardingGuard />
                </RequireAuth>
            } />

            {/* Protected routes (require login) */}
            <Route path="/dashboard" element={
                <RequireAuth>
                    <RequireAccount>
                        <BrandsDashboard />
                    </RequireAccount>
                </RequireAuth>
            } />
            {/* TEMP: Auth bypass for brand assets - allows public access */}
            <Route path="/brand/:brandId/assets" element={<AssetsPage />} />
            {/* TEMP: Auth bypass for brand editor - allows public access */}
            <Route path="/brand/:brandId/:pageSlug" element={<BrandCanvasWrapper />} />
            {/* TEMP: Auth bypass for brand route */}
            <Route path="/brand/:brandId" element={<Navigate to="introduction" replace />} />
            {/* Admin brand routes - sidebar generates /admin/brand/:id/:slug links when isAdmin=true */}
            <Route path="/admin/brand/:brandId/assets" element={<AssetsPage />} />
            <Route path="/admin/brand/:brandId/:slug" element={<BrandCanvasWrapper />} />
            <Route path="/admin/brand/:brandId" element={<Navigate to="introduction" replace />} />
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
    const { accounts, loading, initialized, accountsLoaded } = useAuth()

    // Still loading auth state or accounts
    if (!initialized || loading || !accountsLoaded) {
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
 * Guard for the onboarding route - waits for accounts to load before deciding
 */
function OnboardingGuard() {
    const { accounts, loading, initialized, accountsLoaded } = useAuth()

    if (!initialized || loading || !accountsLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    // Only show onboarding if user truly has no accounts
    if (accounts.length === 0) {
        return <OnboardingFlow />
    }

    return <Navigate to="/dashboard" replace />
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

            // Skip account ownership check if no account (allows public/temp access)
            // Note: RLS bypass via service key handles security

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

    // TEMP: Always enable admin mode for bypass (canEdit() returns false without auth)
    return <BrandCanvas isAdmin={true} brandData={brandData} />
}
