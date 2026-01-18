'use client'

import Image from 'next/image'

interface Brand {
    primaryColor?: string
}

interface BlockHeroData {
    imageUrl: string
    headline: string
    subheadline?: string
    overlayColor?: string
    overlayOpacity?: number
}

interface BlockHeroProps {
    data: BlockHeroData
    brand?: Brand
}

export default function BlockHero({ data, brand }: BlockHeroProps) {
    const { imageUrl, headline, subheadline, overlayColor, overlayOpacity = 0.6 } = data

    return (
        <div className="relative rounded-2xl overflow-hidden -mx-12 -mt-10 mb-8">
            {/* Background Image */}
            <div className="h-80 relative">
                <Image
                    src={imageUrl}
                    alt={headline}
                    fill
                    className="object-cover"
                    sizes="100vw"
                />
                {/* Overlay */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundColor: overlayColor || brand?.primaryColor || '#000',
                        opacity: overlayOpacity
                    }}
                />

                {/* Content */}
                <div className="relative h-full flex flex-col justify-center px-12 z-10">
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
