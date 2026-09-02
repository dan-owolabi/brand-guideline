import { redirect } from 'next/navigation'

/**
 * /admin has never been a real page — the Vite app only ever routed
 * /admin/brand/:id/... beneath it, so bare /admin fell through to a blank
 * screen. Under the App Router that silent blank became a visible 404, which
 * is how the editor's "Back to Dashboard" button surfaced as broken.
 *
 * The button now points at /dashboard. This redirect covers the rest: old
 * bookmarks, and anyone who lands on /admin from a stale link.
 */
export default function Page() {
    redirect('/dashboard')
}
