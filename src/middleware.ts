import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Domain Resolution Middleware
 * 
 * Routes requests based on hostname:
 * - guidr.space → Marketing site
 * - app.guidr.space → Authenticated app
 * - {brand}.guidr.space → Public brand site
 * - custom domain → Public brand site (DB lookup needed)
 */

const DOMAINS = {
    MARKETING: ['guidr.space', 'www.guidr.space'],
    APP: ['app.guidr.space'],
    BASE_DOMAIN: 'guidr.space',
    LOCAL: ['localhost', '127.0.0.1'],
    PREVIEW: 'vercel.app'
}

export type DomainContext =
    | { type: 'marketing'; requiresAuth: false; brand: null }
    | { type: 'app'; requiresAuth: true; brand: null }
    | { type: 'brand'; requiresAuth: false; brand: string }
    | { type: 'custom'; requiresAuth: false; hostname: string }

export function resolveDomainContext(hostname: string): DomainContext {
    // Marketing site (guidr.space, www.guidr.space)
    if (DOMAINS.MARKETING.includes(hostname)) {
        return { type: 'marketing', requiresAuth: false, brand: null }
    }

    // Authenticated app (app.guidr.space)
    if (DOMAINS.APP.includes(hostname)) {
        return { type: 'app', requiresAuth: true, brand: null }
    }

    // Vercel Preview/Staging - treat as App
    if (hostname.endsWith(DOMAINS.PREVIEW)) {
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

    // Local development - check query params
    if (DOMAINS.LOCAL.includes(hostname)) {
        // Default to app context for local development
        return { type: 'app', requiresAuth: true, brand: null }
    }

    // Custom domain (anything else)
    return { type: 'custom', requiresAuth: false, hostname }
}

export function middleware(request: NextRequest) {
    const hostname = request.headers.get('host')?.split(':')[0] || ''
    const { pathname, searchParams } = request.nextUrl

    // Allow Next.js internal routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') // static files
    ) {
        return NextResponse.next()
    }

    // For local development, check _context query param
    if (DOMAINS.LOCAL.includes(hostname)) {
        const context = searchParams.get('_context')

        if (context === 'marketing') {
            const url = request.nextUrl.clone()
            url.pathname = `/marketing${pathname}`
            return NextResponse.rewrite(url)
        }

        if (context && context !== 'app') {
            // Brand context simulation
            const url = request.nextUrl.clone()
            url.pathname = `/brand/${context}${pathname === '/' ? '' : pathname}`
            return NextResponse.rewrite(url)
        }

        // Default: app context - no rewrite needed for admin routes
        return NextResponse.next()
    }

    const domainContext = resolveDomainContext(hostname)

    switch (domainContext.type) {
        case 'marketing': {
            // Rewrite to marketing route group
            if (!pathname.startsWith('/marketing')) {
                const url = request.nextUrl.clone()
                url.pathname = `/marketing${pathname}`
                return NextResponse.rewrite(url)
            }
            break
        }

        case 'brand': {
            // Rewrite to brand route group with slug
            if (!pathname.startsWith('/brand')) {
                const url = request.nextUrl.clone()
                url.pathname = `/brand/${domainContext.brand}${pathname === '/' ? '' : pathname}`
                return NextResponse.rewrite(url)
            }
            break
        }

        case 'custom': {
            // Custom domains need DB lookup - for now, pass hostname as brand identifier
            if (!pathname.startsWith('/brand')) {
                const url = request.nextUrl.clone()
                url.pathname = `/brand/${domainContext.hostname}${pathname === '/' ? '' : pathname}`
                return NextResponse.rewrite(url)
            }
            break
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
    ],
}
