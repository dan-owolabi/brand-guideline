/**
 * Domain constants and pure host resolution.
 *
 * This module must stay free of `window` and of any Next-runtime import so it
 * can run in three places: middleware (edge), server components, and the
 * browser. Anything that needs `window` belongs in domainResolver.js.
 */

export const BASE_DOMAIN = 'guidr.space'
// Staging mirrors production under its own base, one level deeper.
export const STAGING_BASE_DOMAIN = `staging.${BASE_DOMAIN}`

// Bases ordered most-specific first so `staging.guidr.space` resolves against
// the staging base before the production base can treat "staging" as a brand.
const BASES = [STAGING_BASE_DOMAIN, BASE_DOMAIN]

export const MARKETING_HOSTS = [
    BASE_DOMAIN, `www.${BASE_DOMAIN}`,
    STAGING_BASE_DOMAIN, `www.${STAGING_BASE_DOMAIN}`,
]
export const APP_HOSTS = [
    `app.${BASE_DOMAIN}`,
    `app.${STAGING_BASE_DOMAIN}`,
]
export const LOCAL_HOSTS = ['localhost', '127.0.0.1']

/** Subdomains that must never resolve to a brand. */
export const RESERVED_SUBDOMAINS = ['www', 'app', 'api', 'admin', 'cdn', 'assets', 'static', 'mail', 'staging']

/**
 * Resolve a hostname to an app context.
 *
 * Pure: takes the host explicitly rather than reading it from the
 * environment, so middleware can pass the `Host` header and the browser can
 * pass `window.location.hostname` and both get the same answer.
 *
 * @param {string} hostname            bare host, no port
 * @param {URLSearchParams} [params]   only consulted for localhost `_context`
 * @returns {{type: 'app'|'marketing'|'brand'|'custom', brand?: string, hostname?: string}}
 */
export function resolveHost(hostname, params) {
    const host = stripPort(hostname || '')

    if (LOCAL_HOSTS.includes(host)) {
        // Local dev simulates subdomains with ?_context=
        const simulated = params?.get('_context')
        if (simulated === 'app') return { type: 'app' }
        if (simulated === 'marketing') return { type: 'marketing' }
        if (simulated) return { type: 'brand', brand: simulated }
        return { type: 'app' }
    }

    // Raw Vercel deployment/preview URLs (e.g. brandguide-staging.vercel.app)
    // have no brand mapping — show the app shell so the URL is directly usable.
    if (host.endsWith('.vercel.app')) return { type: 'app' }

    if (MARKETING_HOSTS.includes(host)) return { type: 'marketing' }
    if (APP_HOSTS.includes(host)) return { type: 'app' }

    // Brand subdomains, resolved against the most-specific matching base.
    for (const base of BASES) {
        if (host === base) return { type: 'marketing' }
        if (host.endsWith('.' + base)) {
            const slug = host.slice(0, -(base.length + 1))
            // Guard against reserved names and nested subdomains (a.b.<base>).
            if (RESERVED_SUBDOMAINS.includes(slug) || slug.includes('.')) {
                return { type: 'marketing' }
            }
            return { type: 'brand', brand: slug }
        }
    }

    // Anything else is a customer's own domain; needs a DB lookup to resolve.
    return { type: 'custom', hostname: host }
}

export function stripPort(hostname) {
    return hostname.split(':')[0].toLowerCase()
}
