/**
 * Public Brand App Shell
 * 
 * Read-only public view of a brand guideline
 * Accessed via {brand}.guidr.space or custom domains
 */
import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BrandCanvas from './BrandCanvas'
import AssetsPage from './admin/AssetsPage'
import { Loader2 } from 'lucide-react'

export default function PublicBrandApp({ brandIdentifier, isCustomDomain = false }) {
    const [brand, setBrand] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        loadBrand()
    }, [brandIdentifier])

    const loadBrand = async () => {
        try {
            let query = supabase
                .from('brands')
                .select(`
                    id,
                    name,
                    slug,
                    logo_url,
                    primary_color,
                    published,
                    accounts!inner (
                        id,
                        name,
                        slug,
                        logo_url,
                        is_published,
                        custom_domain
                    )
                `)

            if (isCustomDomain) {
                // Lookup by custom domain mapped to the account
                query = query.eq('accounts.custom_domain', brandIdentifier)
            } else {
                // Lookup by brand slug
                query = query.eq('slug', brandIdentifier)
            }

            // Since custom_domain on account might return multiple brands, we use .limit(1).single()
            // Wait, if an account has multiple brands and uses a custom domain, which brand is the default?
            // For now, we take the one that matches or the first one returned by .single()
            const { data: brandData, error } = await query.limit(1).single()

            if (error) throw error

            const accountData = brandData.accounts

            // Check if published
            if (!accountData.is_published) {
                setError('not_published')
                return
            }

            // A brand itself must also be published (have published data)
            if (!brandData.published) {
                setError('not_published')
                return
            }

            setBrand({
                accountId: accountData.id,
                accountName: accountData.name,
                accountSlug: accountData.slug,
                brandId: brandData.id,
                name: brandData.name,
                slug: brandData.slug,
                logoUrl: brandData.logo_url || accountData.logo_url,
                primaryColor: brandData.primary_color,
                published: brandData.published || { tokens: {}, sections: [] }
            })
        } catch (err) {
            console.error('Failed to load brand:', err)
            setError('not_found')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (error === 'not_found') {
        return <NotFoundPage />
    }

    if (error === 'not_published') {
        return <NotPublishedPage />
    }

    if (error === 'no_brand') {
        return <NoBrandPage />
    }

    // Prepare brand data for BrandCanvas
    const brandData = {
        brandId: brand.brandId,
        name: brand.name,
        slug: brand.slug,
        logoUrl: brand.logoUrl,
        primaryColor: brand.primaryColor,
        published: brand.published,
        draft: brand.published // Public view always shows published
    }

    const publishMode = brand.published?.publishMode || 'both'

    return (
        <Routes>
            {/* Assets Route */}
            <Route
                path="/assets"
                element={
                    publishMode === 'guidelines'
                        ? <Navigate to="/" replace />
                        : <AssetsPage isAdmin={false} brandSlug={brandData.slug} basePath="" />
                }
            />

            {/* Guidelines Routes */}
            <Route
                path="/:pageSlug"
                element={
                    publishMode === 'assets'
                        ? <Navigate to="/assets" replace />
                        : <BrandCanvas isAdmin={false} brandData={brandData} basePath="" />
                }
            />
            <Route
                path="/"
                element={
                    publishMode === 'assets'
                        ? <Navigate to="/assets" replace />
                        : <BrandCanvas isAdmin={false} brandData={brandData} basePath="" />
                }
            />
        </Routes>
    )
}

function NotFoundPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">
                    This brand guideline doesn't exist.
                </p>
                <a
                    href="https://guidr.space"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                    Go to Guidr
                </a>
            </div>
        </div>
    )
}

function NotPublishedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    This brand guideline is not published yet.
                </h1>
                <p className="text-gray-600 mb-8">
                    The owner hasn't made this guideline public.
                </p>
                <a
                    href="https://guidr.space"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                    Go to Guidr
                </a>
            </div>
        </div>
    )
}

function NoBrandPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    No brand guidelines found.
                </h1>
                <p className="text-gray-600 mb-8">
                    This account doesn't have any brand guidelines yet.
                </p>
                <a
                    href="https://guidr.space"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                    Go to Guidr
                </a>
            </div>
        </div>
    )
}
