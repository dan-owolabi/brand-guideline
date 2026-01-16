import { Download } from 'lucide-react'

export default function BlockLogoShowcase({ data }) {
    const { logos } = data

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {logos.map((logo, index) => (
                <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                    {/* Logo Preview */}
                    <div className="h-40 bg-gray-50 flex items-center justify-center p-8">
                        {logo.imageUrl ? (
                            <img
                                src={logo.imageUrl}
                                alt={logo.name}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                    e.target.parentNode.innerHTML = `
                    <div class="text-gray-400 text-center">
                      <div class="text-4xl font-bold mb-2">LOGO</div>
                      <div class="text-sm">${logo.name}</div>
                    </div>
                  `
                                }}
                            />
                        ) : (
                            <div className="text-gray-400 text-center">
                                <div className="text-4xl font-bold mb-2">LOGO</div>
                                <div className="text-sm">{logo.name}</div>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="p-4 border-t border-gray-100">
                        <h4 className="font-semibold text-gray-900 text-sm">{logo.name}</h4>
                        <p className="text-gray-500 text-xs mt-1">{logo.description}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
