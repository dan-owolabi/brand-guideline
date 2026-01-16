import { Check, X } from 'lucide-react'

export default function BlockDoDont({ data }) {
    const { title, items } = data

    const dos = items.filter(item => item.type === 'do')
    const donts = items.filter(item => item.type === 'dont')

    return (
        <div>
            {title && (
                <h3 className="text-xl font-bold text-gray-900 mb-6">{title}</h3>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Do's Column */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 font-semibold mb-4">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <Check size={14} />
                        </div>
                        Do
                    </div>
                    {dos.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100"
                        >
                            <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                            <p className="text-gray-700 text-sm">{item.description}</p>
                        </div>
                    ))}
                </div>

                {/* Don'ts Column */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-600 font-semibold mb-4">
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                            <X size={14} />
                        </div>
                        Don't
                    </div>
                    {donts.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-100"
                        >
                            <X size={18} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-gray-700 text-sm">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
