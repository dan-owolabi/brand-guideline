'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
    src: string
    alt: string
    width?: number
    height?: number
    fill?: boolean
    priority?: boolean
    className?: string
    sizes?: string
    quality?: number
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
    onClick?: () => void
}

/**
 * OptimizedImage Component
 * 
 * Wrapper around next/image that automatically:
 * - Converts images to WebP/AVIF format
 * - Lazy loads images by default
 * - Generates responsive srcset
 * - Handles loading states
 * 
 * Usage:
 * <OptimizedImage src={imageUrl} alt="Description" width={800} height={600} />
 * 
 * For full-width images with unknown dimensions:
 * <OptimizedImage src={imageUrl} alt="Description" fill className="object-cover" />
 */
export default function OptimizedImage({
    src,
    alt,
    width,
    height,
    fill = false,
    priority = false,
    className,
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    quality = 85,
    objectFit = 'cover',
    onClick,
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(false)

    // Handle external URLs (Supabase, etc.)
    if (!src) {
        return (
            <div
                className={cn(
                    "bg-gray-100 flex items-center justify-center text-gray-400",
                    className
                )}
                style={!fill ? { width, height } : undefined}
            >
                No image
            </div>
        )
    }

    // Fallback for error states
    if (error) {
        return (
            <div
                className={cn(
                    "bg-gray-100 flex items-center justify-center text-gray-400",
                    className
                )}
                style={!fill ? { width, height } : undefined}
            >
                Failed to load
            </div>
        )
    }

    const imageProps = {
        src,
        alt,
        quality,
        priority,
        sizes,
        className: cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            fill && `object-${objectFit}`,
            className
        ),
        onLoad: () => setIsLoading(false),
        onError: () => setError(true),
        onClick,
    }

    if (fill) {
        return (
            <div className="relative w-full h-full">
                <Image {...imageProps} fill />
                {isLoading && (
                    <div className="absolute inset-0 bg-gray-100 animate-pulse" />
                )}
            </div>
        )
    }

    return (
        <div className="relative" style={{ width, height }}>
            <Image {...imageProps} width={width} height={height} />
            {isLoading && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse rounded" />
            )}
        </div>
    )
}

/**
 * Get the original image URL for downloads
 * This bypasses Next.js image optimization to serve the original file
 */
export function getOriginalImageUrl(url: string): string {
    return url
}
