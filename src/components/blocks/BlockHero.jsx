export default function BlockHero({ data, brand }) {
    const { imageUrl, headline, subheadline, overlayColor, overlayOpacity = 0.6 } = data

    return (
        <div className="relative rounded-2xl overflow-hidden -mx-12 -mt-10 mb-8">
            {/* Background Image */}
            <div
                className="h-80 bg-cover bg-center"
                style={{ backgroundImage: `url(${imageUrl})` }}
            >
                {/* Overlay */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundColor: overlayColor || brand.primaryColor,
                        opacity: overlayOpacity
                    }}
                />

                {/* Content */}
                <div className="relative h-full flex flex-col justify-center px-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 max-w-2xl">
                        {headline}
                    </h2>
                    {subheadline && (
                        <p className="text-xl text-white/90 max-w-xl">
                            {subheadline}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
