import { Download } from 'lucide-react'

export default function BlockAssetGrid({ data, brand }) {
    const { assets } = data

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assets.map((asset, index) => (
                <div
                    key={index}
                    className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all"
                >
                    {/* Thumbnail */}
                    <div className="h-40 bg-gray-100 overflow-hidden">
                        <img
                            src={asset.thumbnailUrl}
                            alt={asset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>

                    {/* Info */}
                    <div className="p-5">
                        <h4 className="font-semibold text-gray-900 text-lg mb-1">{asset.name}</h4>
                        <p className="text-gray-500 text-sm mb-4">{asset.description}</p>

                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">{asset.fileSize}</span>
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
