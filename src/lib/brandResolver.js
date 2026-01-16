/**
 * Brand Resolution Logic
 * 
 * This module abstracts HOW we determine which brand to load.
 * Currently, it relies on URL path parameters (slug or ID).
 * In the future, this can be updated to check window.location.hostname for custom domains.
 */

export function resolveBrandIdentity(params) {
    // 1. Future Hostname Logic (Commented out for now)
    // const hostname = window.location.hostname
    // if (hostname !== 'guidrr.vercel.app' && hostname !== 'localhost') {
    //     return { type: 'hostname', value: hostname }
    // }

    // 2. Current Path Logic
    // We prefer SLUG, then fall back to ID
    if (params.slug) {
        return { type: 'slug', value: params.slug }
    }

    if (params.brandId) {
        return { type: 'id', value: params.brandId }
    }

    return null
}

export function getCanonicalUrl(brandSlug) {
    // This is the source of truth for the canonical URL
    const baseUrl = window.location.origin
    if (!brandSlug) return baseUrl

    return `${baseUrl}/brand/${brandSlug}`
}
