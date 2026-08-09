/**
 * Domain constants and pure host resolution.
 *
 * This module must stay free of `window` and of any Next-runtime import so it
 * can run in three places: middleware (edge), server components, and the
 * browser. Anything that needs `window` belongs in domainResolver.js.
 */

export const BASE_DOMAIN = 'guidr.space'

export const MARKETING_HOSTS = [BASE_DOMAIN, `www.${BASE_DOMAIN}`]
export const APP_HOSTS = [`app.${BASE_DOMAIN}`]
export const LOCAL_HOSTS = ['localhost', '127.0.0.1']

/** Subdomains that must never resolve to a brand. */
export const RESERVED_SUBDOMAINS = ['www', 'app', 'api', 'admin', 'cdn', 'assets', 'static', 'mail']

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

    if (MARKETING_HOSTS.includes(host)) return { type: 'marketing' }
    if (APP_HOSTS.includes(host)) return { type: 'app' }

    if (host.endsWith('.' + BASE_DOMAIN)) {
        const slug = host.slice(0, -(BASE_DOMAIN.length + 1))
        // Guard against both reserved names and nested subdomains (a.b.guidr.space)
        if (RESERVED_SUBDOMAINS.includes(slug) || slug.includes('.')) {
            return { type: 'marketing' }
        }
        return { type: 'brand', brand: slug }
    }

    // Anything else is a customer's own domain; needs a DB lookup to resolve.
    return { type: 'custom', hostname: host }
}

export function stripPort(hostname) {
    return hostname.split(':')[0].toLowerCase()
}
