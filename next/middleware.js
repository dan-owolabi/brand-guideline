import { NextResponse } from 'next/server'
import { resolveHost } from '@/lib/domains'

/**
 * Host-based shell routing.
 *
 * The Vite app decided which shell to render on the client by reading
 * window.location.hostname. That cannot work under SSR — it throws on the
 * server, and guarding it would flash the wrong shell and leave public brand
 * pages unindexable, which is much of the reason for moving to Next.
 *
 * So resolution happens here instead, on the Host header, before any React
 * runs. The URL the user sees never changes; only the internal route does.
 *
 *   guidr.space / www          -> /marketing
 *   app.guidr.space            -> passthrough, paths are already correct
 *   {slug}.guidr.space         -> /b/{slug}/...
 *   anything else              -> /b/domain/{host}/...   (custom domain)
 *
 * Public routes live under /b/ rather than /brand/ because the (app) group
 * already owns /brand/[brandId]/[pageSlug] — a shared prefix would be an
 * unresolvable route collision. Users never see /b/; it is a rewrite target.
 *
 * Locally there are no subdomains, so ?_context= simulates them (see
 * resolveHost). The param is preserved across the rewrite so client-side
 * navigation keeps the same shell.
 */
export function middleware(request) {
    const { nextUrl } = request
    const host = request.headers.get('host') || ''
    const context = resolveHost(host, nextUrl.searchParams)

    // The app shell owns the real path structure — nothing to rewrite.
    if (context.type === 'app') return NextResponse.next()

    const path = nextUrl.pathname

    if (context.type === 'marketing') {
        // Only the root is the marketing page; deeper paths on the marketing
        // host are almost certainly app links that landed on the wrong host.
        if (path === '/') return rewrite(request, '/marketing')
        return NextResponse.next()
    }

    // Public brand rendering. Map the visitor-facing path onto the internal
    // route, preserving any sub-view (currently just /assets).
    const base =
        context.type === 'brand'
            ? `/b/${context.brand}`
            : `/b/domain/${encodeURIComponent(context.hostname)}`

    // Avoid double-rewriting if the request already targets the internal route
    // (Next re-runs middleware on client-side navigations).
    if (path === base || path.startsWith(base + '/')) return NextResponse.next()

    const suffix = path === '/' ? '' : path
    return rewrite(request, `${base}${suffix}`)
}

function rewrite(request, pathname) {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    return NextResponse.rewrite(url)
}

export const config = {
    /**
     * Skip Next internals, the API surface, and anything that looks like a
     * static file. Auth routes must not be rewritten — they always belong to
     * the app shell regardless of host.
     */
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)'],
}
