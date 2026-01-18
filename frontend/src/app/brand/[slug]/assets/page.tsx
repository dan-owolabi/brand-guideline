'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, getAssets, type Asset } from '@/lib/supabase'
import OptimizedImage, { getOriginalImageUrl } from '@/components/ui/OptimizedImage'
import { Download, File, Image as ImageIcon } from 'lucide-react'

export default function AssetsPage() {
    const params = useParams()
    const slug = params.slug as string
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [brandId, setBrandId] = useState<string | null>(null)

    useEffect(() => {
        const loadAssets = async () => {
            try {
                // First get brand ID from slug
                const { data: brand, error: brandError } = await supabase
                    .from('brands')
                    .select('id')
                    .eq('slug', slug)
                    .single()

                if (brandError) throw brandError
                if (!brand) return

                setBrandId(brand.id)
                const assetsData = await getAssets(brand.id)
                setAssets(assetsData)
            } catch (err) {
                console.error('Failed to load assets:', err)
            } finally {
                setLoading(false)
            }
        }

        loadAssets()
    }, [slug])

    const handleDownload = async (asset: Asset) => {
        // Use original URL for downloads (bypasses image optimization)
        const originalUrl = getOriginalImageUrl(asset.file_url)

        const link = document.createElement('a')
        link.href = originalUrl
        link.download = asset.name
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-black"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-xl font-semibold text-gray-900">Brand Assets</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {assets.length === 0 ? (
                    <div className="text-center py-12">
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-lg font-medium text-gray-900 mb-2">No assets yet</h2>
                        <p className="text-gray-500">This brand has no downloadable assets.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {assets.map((asset) => (
                            <div
                                key={asset.id}
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden group"
                            >
                                <div className="aspect-square relative bg-gray-100">
                                    {asset.category === 'image' && asset.thumbnail_url ? (
                                        <OptimizedImage
                                            src={asset.thumbnail_url}
                                            alt={asset.name}
                                            fill
                                            className="object-contain p-2"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <File className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {asset.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-2">
                                        {(asset.file_size / 1024).toFixed(1)} KB
                                    </p>
                                    <button
                                        onClick={() => handleDownload(asset)}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
