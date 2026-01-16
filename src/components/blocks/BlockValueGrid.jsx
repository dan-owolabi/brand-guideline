import * as Icons from 'lucide-react'

export default function BlockValueGrid({ data, brand }) {
    const { values } = data

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => {
                // Dynamically get the icon component
                const IconComponent = Icons[value.icon] || Icons.Star

                return (
                    <div
                        key={index}
                        className="p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all"
                    >
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                            style={{ backgroundColor: brand.primaryColor + '15' }}
                        >
                            <IconComponent
                                size={24}
                                style={{ color: brand.primaryColor }}
                            />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
                    </div>
                )
            })}
        </div>
    )
}
