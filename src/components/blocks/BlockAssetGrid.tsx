'use client'

import { Download } from 'lucide-react'
import Image from 'next/image'

interface Asset {
    name: string
    description?: string
    thumbnailUrl: string
    downloadUrl: string
    fileSize?: string
}

interface Brand {
    primaryColor: string
}

interface BlockAssetGridData {
    assets: Asset[]
}

interface BlockAssetGridProps {
    data: BlockAssetGridData
    brand: Brand
}

export default function BlockAssetGrid({ data, brand }: BlockAssetGridProps) {
    const { assets } = data

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assets.map((asset, index) => (
                <div
                    key={index}
                    className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all"
                >
                    {/* Thumbnail */}
                    <div className="h-40 bg-gray-100 overflow-hidden relative">
                        <Image
                            src={asset.thumbnailUrl}
                            alt={asset.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </div>

                    {/* Info */}
                    <div className="p-5">
                        <h4 className="font-semibold text-gray-900 text-lg mb-1">{asset.name}</h4>
                        {asset.description && (
                            <p className="text-gray-500 text-sm mb-4">{asset.description}</p>
                        )}

                        <div className="flex items-center justify-between">
                            {asset.fileSize && (
                                <span className="text-xs text-gray-400">{asset.fileSize}</span>
                            )}
                            <a
                                href={asset.downloadUrl}
                                download
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
                                style={{ backgroundColor: brand.primaryColor }}
                            >
                                <Download size={16} />
                                Download
                            </a>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
