/**
 * Image Optimization Utilities
 * 
 * Leverages Supabase Storage Image Transformations to serve optimized images.
 * This reduces load times significantly by:
 * 1. Resizing images to appropriate dimensions
 * 2. Compressing with quality settings
 * 3. Converting to modern formats (WebP)
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

/**
 * Get an optimized image URL using Supabase Image Transformations
 * @param {string} originalUrl - The original image URL
 * @param {object} options - Optimization options
 * @param {number} options.width - Target width (optional)
 * @param {number} options.height - Target height (optional)
 * @param {number} options.quality - Quality 1-100 (default: 75)
 * @param {string} options.format - 'webp', 'origin' (default: 'webp')
 * @returns {string} Optimized image URL
 */
export function getOptimizedImageUrl(originalUrl, options = {}) {
    if (!originalUrl) return originalUrl

    // Only optimize Supabase storage URLs
    if (!originalUrl.includes('supabase') || !originalUrl.includes('/storage/v1/object/public/')) {
        return originalUrl
    }

    const {
        width,
        height,
        quality = 75,
        format = 'webp'
    } = options

    // Build transformation parameters
    const params = new URLSearchParams()

    if (width) params.set('width', width.toString())
    if (height) params.set('height', height.toString())
    params.set('quality', quality.toString())
    if (format === 'webp') params.set('format', 'webp')

    // Transform URL from public to render endpoint
    // From: .../storage/v1/object/public/bucket/file.jpg
    // To:   .../storage/v1/render/image/public/bucket/file.jpg?...
    const transformedUrl = originalUrl.replace(
        '/storage/v1/object/public/',
        '/storage/v1/render/image/public/'
    )

    return `${transformedUrl}?${params.toString()}`
}

/**
 * Preset optimizations for common use cases
 */
export const ImagePresets = {
    // For thumbnails and grid previews
    thumbnail: (url) => getOptimizedImageUrl(url, { width: 400, quality: 70 }),

    // For content images in articles
    content: (url) => getOptimizedImageUrl(url, { width: 800, quality: 75 }),

    // For full-width hero images
    hero: (url) => getOptimizedImageUrl(url, { width: 1200, quality: 80 }),

    // For logos (keep quality high)
    logo: (url) => getOptimizedImageUrl(url, { width: 300, quality: 90 }),
}

/**
 * Generate srcset for responsive images
 */
export function getResponsiveSrcSet(url, sizes = [400, 800, 1200]) {
    if (!url || !url.includes('supabase')) return null

    return sizes
        .map(size => `${getOptimizedImageUrl(url, { width: size })} ${size}w`)
        .join(', ')
}
