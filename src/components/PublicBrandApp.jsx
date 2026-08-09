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
            // Public reads go through column-scoped views (migration 010), never
            // the base tables — anon has no base-table access after migration 011.
            let query = supabase
                .from('public_brands')
                .select('id, name, slug, logo_url, primary_color, published, account_id')

            if (isCustomDomain) {
                // Custom domain: find the account that owns this domain, then get its brand
                const { data: acct } = await supabase
                    .from('public_accounts')
                    .select('id')
                    .eq('custom_domain', brandIdentifier)
                    .maybeSingle()

                if (!acct) {
                    throw new Error('No account found for custom domain')
                }
                query = query.eq('account_id', acct.id).limit(1)
            } else {
                // Slug-based lookup — find brand directly, no accounts join required
                query = query.eq('slug', brandIdentifier)
            }

            const { data: brandData, error } = await query.maybeSingle()

            if (error) throw error
            if (!brandData) throw new Error('Brand not found')

            // Brand must have published content
            if (!brandData.published) {
                setError('not_published')
                return
            }

            setBrand({
                accountId: brandData.account_id,
                brandId: brandData.id,
                name: brandData.name,
                slug: brandData.slug,
                logoUrl: brandData.logo_url,
                primaryColor: brandData.primary_color,
                published: brandData.published
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
