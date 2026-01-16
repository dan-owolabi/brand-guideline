export default function BlockTypographyShowcase({ data }) {
    const { fontFamily, specimens } = data

    return (
        <div className="space-y-8">
            <div className="p-6 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Primary Typeface</p>
                <p className="text-3xl font-semibold text-gray-900">{fontFamily}</p>
            </div>

            <div className="divide-y divide-gray-100">
                {specimens.map((specimen, index) => (
                    <div key={index} className="py-6 first:pt-0 last:pb-0">
                        {/* Label */}
                        <div className="flex items-baseline gap-4 mb-3">
                            <span className="text-sm font-medium text-gray-500 w-32 shrink-0">
                                {specimen.label}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">
                                {specimen.size} / {specimen.weight}
                            </span>
                        </div>

                        {/* Sample */}
                        <p
                            className="text-gray-900"
                            style={{
                                fontSize: specimen.size,
                                fontWeight: specimen.weight,
                                fontFamily: fontFamily
                            }}
                        >
                            {specimen.sample}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}
