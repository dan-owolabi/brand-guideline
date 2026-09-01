/**
 * Image optimization via Cloudflare Image Transformations.
 *
 * Previously a pass-through stub, because Supabase's transforms are a Pro-plan
 * feature. Serving assets from an R2 custom domain on Cloudflare makes the
 * same capability free: transformations are requested by URL prefix, so no
 * SDK, no build step, and no per-image pipeline.
 *
 *   https://cdn.guidr.space/cdn-cgi/image/width=400,format=auto/<key>
 *
 * Free tier is 5,000 UNIQUE transformations per month, where "unique" means
 * one option-set per source image per month — repeat requests are cache hits.
 * With the four presets below that is ~1,250 distinct images a month.
 *
 * REQUIREMENTS, and the reason everything degrades gracefully:
 *   - guidr.space must be on Cloudflare DNS, proxied (orange cloud)
 *   - Image Transformations must be enabled for the zone
 * If NEXT_PUBLIC_R2_PUBLIC_BASE is unset, or the URL points somewhere else
 * (an old Supabase object, an external image someone pasted in), every helper
 * returns the original URL untouched. A missing config must degrade to
 * "unoptimised", never to a broken image.
 */

const PUBLIC_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE || ''

/** Only rewrite URLs we actually serve; anything else passes through. */
function isOurAsset(url) {
    return Boolean(PUBLIC_BASE) && typeof url === 'string' && url.startsWith(PUBLIC_BASE)
}

/**
 * @param {string} originalUrl
 * @param {{width?: number, height?: number, quality?: number, fit?: string, format?: string}} options
 */
export function getOptimizedImageUrl(originalUrl, options = {}) {
    if (!originalUrl) return ''
    if (!isOurAsset(originalUrl)) return originalUrl

    // SVGs are already resolution-independent, and rasterising a logo is a
    // downgrade. Leave them alone.
    if (/\.svg(\?|$)/i.test(originalUrl)) return originalUrl

    const {
        width,
        height,
        quality = 80,
        fit = 'scale-down',
        // `auto` lets Cloudflare serve AVIF/WebP based on the Accept header.
        format = 'auto',
    } = options

    const params = [
        width && `width=${Math.round(width)}`,
        height && `height=${Math.round(height)}`,
        `quality=${quality}`,
        `fit=${fit}`,
        `format=${format}`,
    ].filter(Boolean).join(',')

    const key = originalUrl.slice(PUBLIC_BASE.replace(/\/$/, '').length + 1)
    return `${PUBLIC_BASE.replace(/\/$/, '')}/cdn-cgi/image/${params}/${key}`
}

/**
 * Named presets. Kept to four deliberately — each distinct option-set counts
 * separately against the 5,000/month allowance, so more presets means fewer
 * images covered.
 */
export const ImagePresets = {
    thumbnail: (url) => getOptimizedImageUrl(url, { width: 200, quality: 70 }),
    content: (url) => getOptimizedImageUrl(url, { width: 800 }),
    hero: (url) => getOptimizedImageUrl(url, { width: 1600, quality: 85 }),
    logo: (url) => getOptimizedImageUrl(url, { width: 400, fit: 'contain' }),
}

/**
 * srcset for responsive images.
 *
 * Returns null (not an empty string) when unavailable, because callers spread
 * it into JSX as `srcSet={...}` and null omits the attribute while '' would
 * emit an empty one that some browsers treat as a same-page request.
 */
export function getResponsiveSrcSet(url, sizes = [400, 800, 1200]) {
    if (!isOurAsset(url) || /\.svg(\?|$)/i.test(url)) return null
    return sizes.map((w) => `${getOptimizedImageUrl(url, { width: w })} ${w}w`).join(', ')
}
