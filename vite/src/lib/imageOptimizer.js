/**
 * Image Optimization Utilities
 * 
 * Provides lazy loading and placeholder support for images.
 * Note: Supabase Image Transformations require Pro plan.
 * For now, we just pass through URLs and rely on lazy loading.
 */

/**
 * Get image URL - currently passes through unchanged
 * In the future, this can integrate with a CDN or image optimization service
 */
export function getOptimizedImageUrl(originalUrl, _options = {}) {
    // Pass through - Supabase transforms require Pro plan
    return originalUrl || ''
}

/**
 * Preset optimizations - currently just pass through
 */
export const ImagePresets = {
    thumbnail: (url) => url || '',
    content: (url) => url || '',
    hero: (url) => url || '',
    logo: (url) => url || '',
}

/**
 * Generate srcset - disabled for now
 */
export function getResponsiveSrcSet(url, _sizes = [400, 800, 1200]) {
    // Disabled - requires Pro plan
    return null
}
