import { toNextJsHandler } from 'better-auth/next-js'
import { getAuth } from '@/server/auth/config'

/**
 * Catch-all Better Auth endpoint: /api/auth/sign-in, /sign-up, /sign-out,
 * /session, /callback/:provider, /forget-password, /reset-password, …
 *
 * The auth instance is async (it needs a resolved Db handle), so the handler
 * is built per request rather than at module load. getAuth() memoises, so this
 * is one await on an already-settled promise after the first call — and
 * building it lazily is also what keeps `next build` working on machines with
 * no MONGODB_URI.
 */
async function handler(request) {
    const auth = await getAuth()
    const { GET, POST } = toNextJsHandler(auth)
    return request.method === 'GET' ? GET(request) : POST(request)
}

export const GET = handler
export const POST = handler
