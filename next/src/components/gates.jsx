'use client'

/**
 * Auth/account gating components, extracted from the old react-router
 * AuthenticatedApp shell so App Router pages can compose them.
 */
import { useState, useEffect, useCallback } from 'react'
import { Navigate, useParams } from '@/compat/router'
import { useAuth } from '../contexts/AuthContext'
import { brandsApi } from '../lib/api'
import { UploadProvider } from '../contexts/UploadContext'
import BrandCanvas from './BrandCanvas'
import { Loader2 } from 'lucide-react'

export function AppLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
    )
}

/** Requires authentication; redirects to /login with a return URL otherwise. */
export function RequireAuth({ children }) {
    const { user, loading } = useAuth()

    if (loading) return <AppLoading />

    if (!user) {
        const redirect = typeof window !== 'undefined'
            ? encodeURIComponent(window.location.pathname)
            : ''
        return <Navigate to={`/login?redirect=${redirect}`} replace />
    }

    return children
}

/** Waits for accounts to load; the dashboard handles the no-workspace state. */
export function RequireAccount({ children }) {
    const { loading, initialized, accountsLoaded } = useAuth()
    if (!initialized || loading || !accountsLoaded) return <AppLoading />
    return children
}

export function ProtectedAccountRoute({ children }) {
    return (
        <RequireAuth>
            <RequireAccount>{children}</RequireAccount>
        </RequireAuth>
    )
}

/** Renders children only for signed-out users; sends signed-in users to the dashboard. */
export function GuestOnly({ children }) {
    const { user, loading, initialized } = useAuth()
    if (!initialized || loading) return <AppLoading />
    if (user) return <Navigate to="/dashboard" replace />
    return children
}

/** Onboarding route guard — waits for accounts, then decides. */
export function OnboardingGuard({ children }) {
    const { accounts, loading, initialized, accountsLoaded } = useAuth()
    if (!initialized || loading || !accountsLoaded) return <AppLoading />
    if (accounts.length === 0) return children
    return <Navigate to="/dashboard" replace />
}

/** OAuth callback handler — supabase-js auto-detects the session from the URL. */
export function AuthCallback() {
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

/** Loads a brand by id and renders the editable canvas (admin when permitted). */
export function BrandCanvasWrapper() {
    const { brandId } = useParams()
    const { currentAccount, canEdit } = useAuth()
    const [brandData, setBrandData] = useState(null)
    const [loading, setLoading] = useState(true)

    const loadBrand = useCallback(async () => {
        if (!brandId) {
            setLoading(false)
            return
        }
        try {
            const { data, error } = await brandsApi.get(brandId)

            if (error) throw new Error(error.message)
            if (!data) throw new Error('Brand not found')

            setBrandData({
                brandId: data.id,
                accountId: data.account_id,
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
    }, [brandId])

    useEffect(() => {
        loadBrand()
    }, [loadBrand, currentAccount])

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
                    <p className="text-gray-500 mb-4">This brand doesn&apos;t exist or you don&apos;t have access.</p>
                    <a href="/dashboard" className="text-indigo-600 hover:underline">Go to Dashboard</a>
                </div>
            </div>
        )
    }

    const isAdmin = brandData.accountId === currentAccount?.id && canEdit()

    // Blocks several levels down (ImageBlock, ImageGridBlock, AssetBlock) call
    // useUpload(); R2 keys are tenant-prefixed, so they need the account and
    // brand from here rather than a dozen new props.
    return (
        <UploadProvider accountId={brandData.accountId} brandId={brandData.brandId}>
            <BrandCanvas isAdmin={isAdmin} brandData={brandData} />
        </UploadProvider>
    )
}
