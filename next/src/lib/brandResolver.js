/**
 * Brand Resolution Logic
 * 
 * This module abstracts HOW we determine which brand to load.
 * Currently, it relies on URL path parameters (slug or ID).
 * In the future, this can be updated to check window.location.hostname for custom domains.
 */

export function resolveBrandIdentity(params, isAdmin = false) {
    // 1. Future Hostname Logic (Commented out for now)
    // const hostname = window.location.hostname
    // if (hostname !== 'guidrr.vercel.app' && hostname !== 'localhost') {
    //     return { type: 'hostname', value: hostname }
    // }

    // 2. Admin Context: Always prefer brandId
    // Route: /admin/brand/:brandId/:slug (here :slug is the page, not the brand)
    if (isAdmin && params.brandId) {
        return { type: 'id', value: params.brandId }
    }

    // 3. Public Context: :slug is the brand identifier
    // Route: /brand/:slug/:pageSlug
    if (params.slug) {
        // Check if the "slug" is actually a UUID (legacy link or ID-based access)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.slug)
        if (isUuid) {
            return { type: 'id', value: params.slug }
        }
        return { type: 'slug', value: params.slug }
    }

    // Fallback
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
