/**
 * Domain Resolution Module
 * 
 * Centralized logic for determining app context based on hostname.
 * This is the single source of truth for domain routing.
 */

// Domain configuration
const DOMAINS = {
    MARKETING: ['guidr.space', 'www.guidr.space'],
    APP: ['app.guidr.space'],
    BASE_DOMAIN: 'guidr.space',
    // Local development aliases
    LOCAL: ['localhost', '127.0.0.1']
}

/**
 * Resolve the current domain context
 * @returns {Object} Context with type, requiresAuth, and brand info
 */
export function resolveDomainContext() {
    const hostname = window.location.hostname

    // Local development handling
    if (DOMAINS.LOCAL.includes(hostname)) {
        // Check for subdomain simulation via query param or path
        const params = new URLSearchParams(window.location.search)
        const simulatedContext = params.get('_context')

        if (simulatedContext === 'app') {
            return { type: 'app', requiresAuth: true, brand: null }
        }
        if (simulatedContext === 'marketing') {
            return { type: 'marketing', requiresAuth: false, brand: null }
        }
        if (simulatedContext) {
            return { type: 'brand', requiresAuth: false, brand: simulatedContext }
        }

        // Default: treat localhost as app
        return { type: 'app', requiresAuth: true, brand: null }
    }

    // Marketing site (guidr.space, www.guidr.space)
    if (DOMAINS.MARKETING.includes(hostname)) {
        return { type: 'marketing', requiresAuth: false, brand: null }
    }

    // Authenticated app (app.guidr.space)
    if (DOMAINS.APP.includes(hostname)) {
        return { type: 'app', requiresAuth: true, brand: null }
    }

    // Brand subdomain ({brand}.guidr.space)
    if (hostname.endsWith('.' + DOMAINS.BASE_DOMAIN)) {
        const slug = hostname.replace('.' + DOMAINS.BASE_DOMAIN, '')
        // Prevent reserved subdomains
        if (['www', 'app', 'api', 'admin'].includes(slug)) {
            return { type: 'marketing', requiresAuth: false, brand: null }
        }
        return { type: 'brand', requiresAuth: false, brand: slug }
    }

    // Custom domain (anything else)
    // Will need DB lookup to resolve
    return { type: 'custom', requiresAuth: false, hostname }
}

/**
 * Check if current context is the authenticated app
 */
export function isAppContext() {
    return resolveDomainContext().type === 'app'
}

/**
 * Check if current context is a public brand site
 */
export function isBrandContext() {
    const context = resolveDomainContext()
    return context.type === 'brand' || context.type === 'custom'
}

/**
 * Check if current context is the marketing site
 */
export function isMarketingContext() {
    return resolveDomainContext().type === 'marketing'
}

/**
 * Get the canonical URL for a brand
 * @param {string} slug - Brand slug
 * @param {string} customDomain - Optional custom domain
 */
export function getBrandUrl(slug, customDomain = null) {
    if (customDomain) {
        return `https://${customDomain}`
    }
    return `https://${slug}.${DOMAINS.BASE_DOMAIN}`
}

/**
 * Get the app URL
 */
export function getAppUrl() {
    if (DOMAINS.LOCAL.includes(window.location.hostname)) {
        return `${window.location.protocol}//${window.location.host}?_context=app`
    }
    return `https://app.${DOMAINS.BASE_DOMAIN}`
}

/**
 * Get the app origin (no path/query) for auth redirects
 */
export function getAppOrigin() {
    if (DOMAINS.LOCAL.includes(window.location.hostname)) {
        return `${window.location.protocol}//${window.location.host}`
    }
    return `https://app.${DOMAINS.BASE_DOMAIN}`
}

/**
 * Get the auth callback URL
 */
export function getAuthCallbackUrl() {
    return `${getAppOrigin()}/auth/callback`
}

/**
 * Get the marketing site URL
 */
export function getMarketingUrl() {
    if (DOMAINS.LOCAL.includes(window.location.hostname)) {
        return `${window.location.protocol}//${window.location.host}?_context=marketing`
    }
    return `https://${DOMAINS.BASE_DOMAIN}`
}

export default {
    resolveDomainContext,
    isAppContext,
    isBrandContext,
    isMarketingContext,
    getBrandUrl,
    getAppUrl,
    getAppOrigin,
    getAuthCallbackUrl,
    getMarketingUrl
}
