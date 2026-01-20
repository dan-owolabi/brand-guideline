import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

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

export async function middleware(request: NextRequest) {
    // 1. Initialize Supabase and handle cookies
    // We collect cookies to set on the final response
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: This call refreshes the auth token and updates request cookies
    // It is required for Server Components to have the latest session
    const { data: { user } } = await supabase.auth.getUser()


    // 2. Domain Routing Logic
    const hostname = request.headers.get('host')?.split(':')[0] || ''
    const { pathname, searchParams } = request.nextUrl

    // Allow Next.js internal routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') // static files
    ) {
        return response
    }

    let finalResponse = response

    // For local development, check _context query param
    if (DOMAINS.LOCAL.includes(hostname)) {
        const context = searchParams.get('_context')

        if (context === 'marketing') {
            const url = request.nextUrl.clone()
            url.pathname = `/marketing${pathname}`
            finalResponse = NextResponse.rewrite(url)
        }
        else if (context && context !== 'app') {
            // Brand context simulation
            const url = request.nextUrl.clone()
            url.pathname = `/brand/${context}${pathname === '/' ? '' : pathname}`
            finalResponse = NextResponse.rewrite(url)
        }
        // Default: app context - no rewrite needed for admin routes
        // finalResponse remains 'response' (NextResponse.next())
    } else {
        const domainContext = resolveDomainContext(hostname)

        switch (domainContext.type) {
            case 'app': {
                if (pathname === '/') {
                    finalResponse = NextResponse.redirect(new URL('/login', request.url))
                }
                break
            }

            case 'marketing': {
                // Rewrite to marketing route group
                if (!pathname.startsWith('/marketing')) {
                    const url = request.nextUrl.clone()
                    url.pathname = `/marketing${pathname}`
                    finalResponse = NextResponse.rewrite(url)
                }
                break
            }

            case 'brand': {
                // Rewrite to brand route group with slug
                if (!pathname.startsWith('/brand')) {
                    const url = request.nextUrl.clone()
                    url.pathname = `/brand/${domainContext.brand}${pathname === '/' ? '' : pathname}`
                    finalResponse = NextResponse.rewrite(url)
                }
                break
            }

            case 'custom': {
                // Custom domains need DB lookup - for now, pass hostname as brand identifier
                if (!pathname.startsWith('/brand')) {
                    const url = request.nextUrl.clone()
                    url.pathname = `/brand/${domainContext.hostname}${pathname === '/' ? '' : pathname}`
                    finalResponse = NextResponse.rewrite(url)
                }
                break
            }
        }
    }

    // 3. Ensure cookies from Supabase are carried over to finalResponse
    // If 'response' was modified by setAll, its cookies are in 'response.cookies'
    // We need to make sure 'finalResponse' includes them.
    // If we created a new Rewrite/Redirect response, it starts empty.

    // Copy cookies from our tracker 'response' to 'finalResponse' if they are different objects
    if (finalResponse !== response) {
        response.cookies.getAll().forEach(cookie => {
            finalResponse.cookies.set(cookie.name, cookie.value, cookie)
        })
    }

    finalResponse.headers.set('x-debug-hostname', hostname)
    // finalResponse.headers.set('x-debug-user', user?.email || 'none') // Optional debug

    return finalResponse
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
