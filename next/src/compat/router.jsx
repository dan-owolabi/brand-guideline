'use client'

/**
 * react-router-dom → next/navigation compatibility shim.
 *
 * The app was ported from a Vite + react-router SPA. Rather than rewrite every
 * call site, ported components import their routing primitives from here instead
 * of 'react-router-dom'. Each primitive is reimplemented on top of Next's
 * App Router so behavior stays identical.
 *
 * NOTE: <Routes>/<Route>/<BrowserRouter> are intentionally NOT provided — routing
 * is handled by the App Router's file-based pages, so those are dropped during port.
 */

import { useCallback } from 'react'
import { useEffect } from 'react'
import NextLink from 'next/link'
import {
    useRouter,
    usePathname,
    useParams as useNextParams,
    useSearchParams as useNextSearchParams,
} from 'next/navigation'

// useNavigate() → (to, { replace }) => void  (also supports navigate(-1))
export function useNavigate() {
    const router = useRouter()
    return useCallback((to, options = {}) => {
        if (typeof to === 'number') {
            // react-router supports navigate(-1) to go back
            if (to < 0) router.back()
            else router.forward()
            return
        }
        const href = typeof to === 'string' ? to : toHref(to)
        if (options.replace) router.replace(href)
        else router.push(href)
    }, [router])
}

// useParams() — Next returns the same shape; segment names must match ([brandId], etc.)
export function useParams() {
    return useNextParams() || {}
}

// useLocation() → { pathname, search, hash, state }
export function useLocation() {
    const pathname = usePathname()
    const searchParams = useNextSearchParams()
    const qs = searchParams?.toString()
    return {
        pathname: pathname || '/',
        search: qs ? `?${qs}` : '',
        hash: '',
        state: null,
    }
}

// useSearchParams() → [searchParams, setSearchParams]  (react-router signature)
export function useSearchParams() {
    const searchParams = useNextSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const setSearchParams = useCallback((next, opts = {}) => {
        const base = new URLSearchParams(searchParams?.toString() || '')
        const resolved = typeof next === 'function' ? next(base) : next
        const params = resolved instanceof URLSearchParams
            ? resolved
            : new URLSearchParams(resolved)
        const qs = params.toString()
        const url = qs ? `${pathname}?${qs}` : pathname
        if (opts.replace) router.replace(url)
        else router.push(url)
    }, [searchParams, router, pathname])

    return [searchParams, setSearchParams]
}

// <Link to="..."> → next/link with href
export function Link({ to, replace, state: _state, ...rest }) {
    return <NextLink href={typeof to === 'string' ? to : toHref(to)} replace={replace} {...rest} />
}

// <NavLink> with isActive support for className/style/children
export function NavLink({ to, end = false, className, style, children, ...rest }) {
    const pathname = usePathname()
    const href = typeof to === 'string' ? to : toHref(to)
    const isActive = end ? pathname === href : pathname === href || pathname.startsWith(href + '/')

    const resolvedClassName = typeof className === 'function' ? className({ isActive }) : className
    const resolvedStyle = typeof style === 'function' ? style({ isActive }) : style
    const resolvedChildren = typeof children === 'function' ? children({ isActive }) : children

    return (
        <NextLink href={href} className={resolvedClassName} style={resolvedStyle} {...rest}>
            {resolvedChildren}
        </NextLink>
    )
}

// <Navigate to="..." replace /> — imperative redirect on mount
export function Navigate({ to, replace = false }) {
    const router = useRouter()
    const href = typeof to === 'string' ? to : toHref(to)
    useEffect(() => {
        if (replace) router.replace(href)
        else router.push(href)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [href])
    return null
}

// Helper: react-router accepts `to` as an object { pathname, search, hash }
function toHref(to) {
    if (!to || typeof to === 'string') return to || '/'
    const { pathname = '', search = '', hash = '' } = to
    return `${pathname}${search}${hash}`
}
