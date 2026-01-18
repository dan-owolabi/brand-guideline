/**
 * Image Optimization Utilities
 * 
 * Provides lazy loading and placeholder support for images.
 * Note: Supabase Image Transformations require Pro plan.
 * For now, we just pass through URLs and rely on lazy loading.
 */

export interface OptimizedImageOptions {
    width?: number
    height?: number
    quality?: number
}

/**
 * Get image URL - currently passes through unchanged
 * In the future, this can integrate with a CDN or image optimization service
 */
export function getOptimizedImageUrl(originalUrl: string | undefined | null, options: OptimizedImageOptions = {}): string {
    // Pass through - Supabase transforms require Pro plan
    return originalUrl || ''
}

/**
 * Preset optimizations - currently just pass through
 */
export const ImagePresets = {
    thumbnail: (url: string) => url || '',
    content: (url: string) => url || '',
    hero: (url: string) => url || '',
    logo: (url: string) => url || '',
}

/**
 * Generate srcset - disabled for now
 */
export function getResponsiveSrcSet(url: string, sizes = [400, 800, 1200]): string | null {
    // Disabled - requires Pro plan
    return null
}
