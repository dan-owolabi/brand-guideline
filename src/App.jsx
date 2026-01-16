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
function BrandCanvasWrapper({ isAdmin }) {
  const { brandId, slug } = useParams()
  const identifier = brandId || slug
  const [brandData, setBrandData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBrand = async () => {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)

        let query = supabase
          .from('brands')
          .select('id, name, logo_url, primary_color, font_family, published, draft, slug')

        if (isUuid) {
          query = query.eq('id', identifier)
        } else {
          query = query.eq('slug', identifier)
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

    if (identifier) loadBrand()
  }, [identifier])

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
          <p className="mb-4 text-gray-500">The brand you are looking for does not exist.</p>
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
      {/* Admin Routes */}
      <Route path="/admin" element={<BrandsDashboard />} />
      <Route path="/admin/brand/:brandId/assets" element={<AssetsPage />} />
      <Route path="/admin/brand/:brandId/:slug" element={<BrandCanvasWrapper isAdmin={true} />} />
      <Route path="/admin/brand/:brandId" element={<Navigate to="introduction" replace />} />

      {/* Legacy Public Routes (ID Based) */}
      <Route path="/brand/:brandId/assets" element={<AssetsPage isAdmin={false} />} />
      <Route path="/brand/:brandId/:slug" element={<BrandCanvasWrapper isAdmin={false} />} />
      <Route path="/brand/:brandId" element={<Navigate to="introduction" replace />} />

      {/* New Root Slug Routes (e.g. /acme) */}
      <Route path="/:slug/assets" element={<AssetsPage isAdmin={false} />} />
      <Route path="/:slug/:pageSlug" element={<BrandCanvasWrapper isAdmin={false} />} />
      <Route path="/:slug" element={<BrandCanvasWrapper isAdmin={false} />} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default App
