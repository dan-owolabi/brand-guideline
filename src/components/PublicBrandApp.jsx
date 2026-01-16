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
                .from('accounts')
                .select(`
                    id,
                    name,
                    slug,
                    logo_url,
                    is_published,
                    custom_domain,
                    brands (
                        id,
                        name,
                        logo_url,
                        primary_color,
                        published,
                        slug
                    )
                `)

            if (isCustomDomain) {
                // Lookup by custom domain
                query = query.eq('custom_domain', brandIdentifier)
            } else {
                // Lookup by slug
                query = query.eq('slug', brandIdentifier)
            }

            const { data, error } = await query.single()

            if (error) throw error

            // Check if published
            if (!data.is_published) {
                setError('not_published')
                return
            }

            // Get the first/default brand
            const defaultBrand = data.brands?.[0]
            if (!defaultBrand) {
                setError('no_brand')
                return
            }

            setBrand({
                accountId: data.id,
                accountName: data.name,
                accountSlug: data.slug,
                brandId: defaultBrand.id,
                name: defaultBrand.name,
                slug: defaultBrand.slug,
                logoUrl: defaultBrand.logo_url || data.logo_url,
                primaryColor: defaultBrand.primary_color,
                published: defaultBrand.published || { tokens: {}, sections: [] }
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

    return (
        <Routes>
            <Route path="/assets" element={<AssetsPage isAdmin={false} brandSlug={brandData.slug} />} />
            <Route path="/:pageSlug" element={<BrandCanvas isAdmin={false} brandData={brandData} />} />
            <Route path="/" element={<BrandCanvas isAdmin={false} brandData={brandData} />} />
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
