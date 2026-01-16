import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import BrandCanvas from './components/BrandCanvas'
import BrandsDashboard from './components/admin/BrandsDashboard'
import AssetsPage from './components/admin/AssetsPage'
import { supabase } from './lib/supabase'

/**
 * BrandCanvasWrapper - Fetches brand data for a specific brand ID
 */
/**
 * BrandCanvasWrapper - Fetches brand data for a specific brand ID or Slug
 */
// ... imports
import { resolveBrandIdentity } from './lib/brandResolver'

/**
 * BrandCanvasWrapper - Fetches brand data using the resolver
 */
function BrandCanvasWrapper({ isAdmin }) {
  const params = useParams()
  const identity = resolveBrandIdentity(params)

  const [brandData, setBrandData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBrand = async () => {
      if (!identity) {
        setLoading(false)
        return
      }

      try {
        let query = supabase
          .from('brands')
          .select('id, name, logo_url, primary_color, font_family, published, draft, slug')

        if (identity.type === 'id') {
          query = query.eq('id', identity.value)
        } else if (identity.type === 'slug') {
          query = query.eq('slug', identity.value)
        }

        const { data, error } = await query.single()

        if (error) throw error

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

    loadBrand()
  }, [JSON.stringify(identity)]) // Depend on the stable identity object

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-black"></div>
      </div>
    )
  }

  if (!brandData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Brand not found</h1>
          <p className="mb-4 text-gray-500">The brand guide you are looking for does not exist.</p>
          <a href="/admin" className="text-indigo-600 hover:underline">Go to Dashboard</a>
        </div>
      </div>
    )
  }

  return <BrandCanvas isAdmin={isAdmin} brandData={brandData} />
}

function App() {
  return (
    <Routes>
      {/* 
        -------------------------------------------
        ADMIN ROUTES (App)
        -------------------------------------------
      */}
      <Route path="/admin" element={<BrandsDashboard />} />
      <Route path="/admin/brand/:brandId/assets" element={<AssetsPage />} />
      <Route path="/admin/brand/:brandId/:slug" element={<BrandCanvasWrapper isAdmin={true} />} />
      <Route path="/admin/brand/:brandId" element={<Navigate to="introduction" replace />} />

      {/* 
        -------------------------------------------
        PUBLIC BRAND ROUTES
        Strict Contract: /brand/:slug
        -------------------------------------------
      */}

      {/* Canonical Public Route */}
      <Route path="/brand/:slug/assets" element={<AssetsPage isAdmin={false} />} />
      <Route path="/brand/:slug/:pageSlug" element={<BrandCanvasWrapper isAdmin={false} />} />
      <Route path="/brand/:slug" element={<BrandCanvasWrapper isAdmin={false} />} />

      {/* Legacy/ID Fallback support (Optional: maintain for old links if needed, or remove to strictly enforce contract) */}
      {/* We will map :slug param to ID matches in resolver if needed, but for now we separate them effectively via resolving logic */}

      {/* 
        -------------------------------------------
        DEFAULT / 404
        -------------------------------------------
      */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default App
