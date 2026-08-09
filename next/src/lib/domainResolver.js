/**
 * Canonical URL generation.
 *
 * SSR NOTE: these are called during render (e.g. MarketingApp), so they must
 * return the SAME value on the server and on the client or React will report a
 * hydration mismatch. That rules out reading `window.location` — instead the
 * origins come from build-time env vars with production defaults.
 *
 * Set these in .env.local for local development:
 *   NEXT_PUBLIC_APP_ORIGIN=http://localhost:3000
 *   NEXT_PUBLIC_MARKETING_ORIGIN=http://localhost:3000
 *
 * Host *resolution* (deciding which shell a request gets) does NOT live here
 * any more — it moved to next/middleware.js, which reads the Host header. The
 * pure predicate it uses is exported from ./domains.js. The old
 * resolveDomainContext/isAppContext/isBrandContext/isMarketingContext helpers
 * were removed: they read window.location at call time, which throws under
 * SSR, and nothing in the App Router port consumed them.
 */

import { BASE_DOMAIN } from './domains'

const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_ORIGIN || `https://app.${BASE_DOMAIN}`
const MARKETING_ORIGIN = process.env.NEXT_PUBLIC_MARKETING_ORIGIN || `https://${BASE_DOMAIN}`

/**
 * Canonical public URL for a brand.
 * @param {string} slug
 * @param {string|null} customDomain
 */
export function getBrandUrl(slug, customDomain = null) {
    if (customDomain) return `https://${customDomain}`

    // Locally there are no wildcard subdomains, so fall back to the
    // ?_context= simulation the middleware understands.
    if (isLocalOrigin(APP_ORIGIN)) return `${APP_ORIGIN}?_context=${slug}`

    return `https://${slug}.${BASE_DOMAIN}`
}

/** Origin of the authenticated app (no trailing slash). */
export function getAppOrigin() {
    return APP_ORIGIN
}

/** Entry URL for the authenticated app. */
export function getAppUrl() {
    if (isLocalOrigin(APP_ORIGIN)) return `${APP_ORIGIN}?_context=app`
    return APP_ORIGIN
}

/** OAuth / email callback URL. */
export function getAuthCallbackUrl() {
    return `${APP_ORIGIN}/auth/callback`
}

/** Marketing site URL. */
export function getMarketingUrl() {
    if (isLocalOrigin(MARKETING_ORIGIN)) return `${MARKETING_ORIGIN}?_context=marketing`
    return MARKETING_ORIGIN
}

function isLocalOrigin(origin) {
    return origin.includes('localhost') || origin.includes('127.0.0.1')
}

export default {
    getBrandUrl,
    getAppUrl,
    getAppOrigin,
    getAuthCallbackUrl,
    getMarketingUrl,
}
