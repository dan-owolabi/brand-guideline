'use client'

import { useState, useEffect } from 'react'

/**
 * Renders children only after mounting on the client.
 *
 * The app was ported from a Vite SPA that reads `window`/`localStorage` during
 * render (domain resolution, auth redirects, etc.). Server-rendering those trees
 * throws "window is not defined", so we skip SSR for them and hydrate on the
 * client — matching the original SPA's behavior.
 */
export default function ClientOnly({ children, fallback = null }) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])
    if (!mounted) return fallback
    return children
}
