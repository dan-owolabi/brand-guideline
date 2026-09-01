import 'server-only'
import { getDb } from '../db/client.js'
import { COLLECTIONS, roleAtLeast } from '../db/schema.js'

/**
 * Authorization guards.
 *
 * These are the ONLY way to obtain a `ctx`, and every repo function requires a
 * `ctx`. That is what replaces Postgres RLS: a repo call without a ctx is a
 * type/shape error at the call site rather than a silent full-table read.
 *
 * ctx = { userId, accountId, role }
 *
 * SESSION SEAM: Better Auth arrives in Phase 5. Until then `resolveSession` is
 * injectable so the guard and the whole repo layer can be built and tested
 * now. Phase 5 replaces the default implementation only — no call site
 * changes.
 */

export class AuthError extends Error {
    constructor(status, message) {
        super(message)
        this.name = 'AuthError'
        this.status = status
    }
}

export const unauthorized = (m = 'Not signed in') => new AuthError(401, m)
export const forbidden = (m = 'Not permitted') => new AuthError(403, m)
export const notFound = (m = 'Not found') => new AuthError(404, m)

/**
 * Default session resolver. Phase 5 swaps the body for Better Auth's
 * `auth.api.getSession({ headers })`.
 * @returns {Promise<{userId: string}|null>}
 */
/**
 * Resolve the session from Better Auth.
 *
 * This used to be a no-op that a side-effect import (`server/auth/session.js`)
 * replaced at startup. That was subtly broken: route handlers are bundled
 * separately, so a route whose bundle did not happen to pull in that module
 * kept the un-installed default and answered 401 — intermittently, depending
 * on bundling. It showed up as an authenticated PATCH failing with "Not signed
 * in" immediately after an authenticated POST succeeded.
 *
 * Resolving directly here removes the install-order dependency entirely. The
 * import is dynamic to keep `next build` working without MONGODB_URI (config
 * opens a connection) and to avoid a static cycle.
 */
let resolveSession = async function defaultResolveSession(request) {
    const headers = request?.headers
    if (!headers) return null

    const { getAuth } = await import('./config.js')
    const auth = await getAuth()
    const session = await auth.api.getSession({ headers })

    if (!session?.user?.id) return null
    /**
     * Normalize the id to a STRING before it reaches any repo.
     *
     * Better Auth stores user._id as a BSON UUID, and its Mongo adapter is
     * documented as converting back to a string on read — but on this path it
     * does not: session.user.id arrives as a UUID object. Our own collections
     * store members[].userId as a plain string, and Mongo does not consider a
     * UUID equal to its string form, so `{'members.userId': <UUID>}` matches
     * zero documents and every workspace silently disappears. No error, no
     * 401 — just an empty dashboard.
     *
     * One String() here covers every repo, because this is the only place a
     * session id enters the system.
     */
    return { userId: String(session.user.id), user: session.user }
}

/** Test/bootstrap seam. Phase 5 calls this once with the Better Auth resolver. */
export function setSessionResolver(fn) {
    resolveSession = fn
}

/** Signed-in user or 401. */
export async function requireSession(request) {
    const session = await resolveSession(request)
    if (!session?.userId) throw unauthorized()
    return session
}

/**
 * Assert the caller is a member of `accountId` with at least `minRole`, and
 * return the ctx that repos require.
 *
 * One indexed lookup against the embedded members array — no join, because
 * account_members was folded into the account document. The positional
 * projection returns only the caller's own membership, so this cannot
 * accidentally hand the full member roster to a viewer.
 *
 * Deliberately returns 404 rather than 403 when the account exists but the
 * caller is not a member: a 403 would confirm the account id is real, which
 * turns this endpoint into an enumeration oracle.
 */
export async function requireAccountRole(request, accountId, minRole = 'viewer') {
    const { userId } = await requireSession(request)

    if (typeof accountId !== 'string' || !accountId) throw notFound('Unknown account')

    const db = await getDb()
    const account = await db.collection(COLLECTIONS.accounts).findOne(
        { _id: accountId, 'members.userId': userId },
        { projection: { 'members.$': 1 } }
    )

    if (!account) throw notFound('Unknown account')

    const role = account.members?.[0]?.role
    if (!roleAtLeast(role, minRole)) {
        throw forbidden(`Requires ${minRole}; you are ${role ?? 'not a member'}`)
    }

    return { userId, accountId, role }
}

/**
 * Resolve a brand IDENTIFIER — its id or its slug — to the ctx of the owning
 * account, enforcing minRole.
 *
 * Most routes are addressed by brand, not by account, and the editor addresses
 * brands by slug as often as by id. Doing that lookup here, unscoped, and then
 * authorizing the resulting accountId keeps the single unscoped read in ONE
 * audited place rather than scattering id-or-slug sniffing across repos.
 *
 * The resolved brandId is returned on the ctx so callers never re-resolve —
 * and so downstream repo calls are always keyed by id, never by a slug that
 * could collide across tenants.
 */
export async function requireBrandRole(request, identifier, minRole = 'viewer') {
    // Resolve the session first purely so an anonymous caller gets 401 rather
    // than a 404 that depends on whether the brand happens to exist.
    // requireAccountRole below resolves it again to build the ctx.
    await requireSession(request)

    if (typeof identifier !== 'string' || !identifier) throw notFound('Unknown brand')

    const db = await getDb()
    const brand = await db
        .collection(COLLECTIONS.brands)
        .findOne(
            { $or: [{ _id: identifier }, { slug: identifier }] },
            { projection: { accountId: 1 } }
        )

    if (!brand) throw notFound('Unknown brand')

    const ctx = await requireAccountRole(request, brand.accountId, minRole)
    return { ...ctx, brandId: brand._id }
}

/** Map an AuthError (or anything else) onto a Response for route handlers. */
export function toErrorResponse(err) {
    if (err instanceof AuthError) {
        return Response.json({ error: err.message }, { status: err.status })
    }
    console.error('Unhandled server error:', err)
    return Response.json({ error: 'Internal error' }, { status: 500 })
}
