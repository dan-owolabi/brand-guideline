(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__8978dbac._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware,
    "resolveDomainContext",
    ()=>resolveDomainContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [middleware-edge] (ecmascript)");
;
;
/**
 * Domain Resolution Middleware
 * 
 * Routes requests based on hostname:
 * - guidr.space → Marketing site
 * - app.guidr.space → Authenticated app
 * - {brand}.guidr.space → Public brand site
 * - custom domain → Public brand site (DB lookup needed)
 */ const DOMAINS = {
    MARKETING: [
        'guidr.space',
        'www.guidr.space'
    ],
    APP: [
        'app.guidr.space'
    ],
    BASE_DOMAIN: 'guidr.space',
    LOCAL: [
        'localhost',
        '127.0.0.1'
    ],
    PREVIEW: 'vercel.app'
};
function resolveDomainContext(hostname) {
    // Marketing site (guidr.space, www.guidr.space)
    if (DOMAINS.MARKETING.includes(hostname)) {
        return {
            type: 'marketing',
            requiresAuth: false,
            brand: null
        };
    }
    // Authenticated app (app.guidr.space)
    if (DOMAINS.APP.includes(hostname)) {
        return {
            type: 'app',
            requiresAuth: true,
            brand: null
        };
    }
    // Vercel Preview/Staging - treat as App
    if (hostname.endsWith(DOMAINS.PREVIEW)) {
        return {
            type: 'app',
            requiresAuth: true,
            brand: null
        };
    }
    // Brand subdomain ({brand}.guidr.space)
    if (hostname.endsWith('.' + DOMAINS.BASE_DOMAIN)) {
        const slug = hostname.replace('.' + DOMAINS.BASE_DOMAIN, '');
        // Prevent reserved subdomains
        if ([
            'www',
            'app',
            'api',
            'admin'
        ].includes(slug)) {
            return {
                type: 'marketing',
                requiresAuth: false,
                brand: null
            };
        }
        return {
            type: 'brand',
            requiresAuth: false,
            brand: slug
        };
    }
    // Local development - check query params
    if (DOMAINS.LOCAL.includes(hostname)) {
        // Default to app context for local development
        return {
            type: 'app',
            requiresAuth: true,
            brand: null
        };
    }
    // Custom domain (anything else)
    return {
        type: 'custom',
        requiresAuth: false,
        hostname
    };
}
async function middleware(request) {
    // 1. Initialize Supabase and handle cookies
    // We collect cookies to set on the final response
    let response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next({
        request: {
            headers: request.headers
        }
    });
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["createServerClient"])(("TURBOPACK compile-time value", "https://ahfsosoabcvxgcwharui.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZnNvc29hYmN2eGdjd2hhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMjk1NTQsImV4cCI6MjA4NDcwNTU1NH0.Gi4EodMwX7sQSaOhGKuH9bCYl-3zxicuSxXQhUmApdc"), {
        cookies: {
            getAll () {
                return request.cookies.getAll();
            },
            setAll (cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options })=>request.cookies.set(name, value));
                response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next({
                    request: {
                        headers: request.headers
                    }
                });
                cookiesToSet.forEach(({ name, value, options })=>response.cookies.set(name, value, options));
            }
        }
    });
    // IMPORTANT: This call refreshes the auth token and updates request cookies
    // It is required for Server Components to have the latest session
    const { data: { user } } = await supabase.auth.getUser();
    // 2. Domain Routing Logic
    const hostname = request.headers.get('host')?.split(':')[0] || '';
    const { pathname, searchParams } = request.nextUrl;
    // Allow Next.js internal routes
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.') // static files
    ) {
        return response;
    }
    let finalResponse = response;
    // For local development, check _context query param
    if (DOMAINS.LOCAL.includes(hostname)) {
        const context = searchParams.get('_context');
        if (context === 'marketing') {
            const url = request.nextUrl.clone();
            url.pathname = `/marketing${pathname}`;
            finalResponse = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].rewrite(url);
        } else if (context && context !== 'app') {
            // Brand context simulation
            const url = request.nextUrl.clone();
            url.pathname = `/brand/${context}${pathname === '/' ? '' : pathname}`;
            finalResponse = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].rewrite(url);
        }
    // Default: app context - no rewrite needed for admin routes
    // finalResponse remains 'response' (NextResponse.next())
    } else {
        const domainContext = resolveDomainContext(hostname);
        switch(domainContext.type){
            case 'app':
                {
                    if (pathname === '/') {
                        finalResponse = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/login', request.url));
                    }
                    break;
                }
            case 'marketing':
                {
                    // Rewrite to marketing route group
                    if (!pathname.startsWith('/marketing')) {
                        const url = request.nextUrl.clone();
                        url.pathname = `/marketing${pathname}`;
                        finalResponse = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].rewrite(url);
                    }
                    break;
                }
            case 'brand':
                {
                    // Rewrite to brand route group with slug
                    if (!pathname.startsWith('/brand')) {
                        const url = request.nextUrl.clone();
                        url.pathname = `/brand/${domainContext.brand}${pathname === '/' ? '' : pathname}`;
                        finalResponse = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].rewrite(url);
                    }
                    break;
                }
            case 'custom':
                {
                    // Custom domains need DB lookup - for now, pass hostname as brand identifier
                    if (!pathname.startsWith('/brand')) {
                        const url = request.nextUrl.clone();
                        url.pathname = `/brand/${domainContext.hostname}${pathname === '/' ? '' : pathname}`;
                        finalResponse = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].rewrite(url);
                    }
                    break;
                }
        }
    }
    // 3. Ensure cookies from Supabase are carried over to finalResponse
    // If 'response' was modified by setAll, its cookies are in 'response.cookies'
    // We need to make sure 'finalResponse' includes them.
    // If we created a new Rewrite/Redirect response, it starts empty.
    // Copy cookies from our tracker 'response' to 'finalResponse' if they are different objects
    if (finalResponse !== response) {
        response.cookies.getAll().forEach((cookie)=>{
            finalResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
    }
    finalResponse.headers.set('x-debug-hostname', hostname);
    // finalResponse.headers.set('x-debug-user', user?.email || 'none') // Optional debug
    return finalResponse;
}
const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */ '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__8978dbac._.js.map