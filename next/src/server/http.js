import 'server-only'
import { AuthError } from './auth/guard.js'

/**
 * Shared route-handler plumbing.
 *
 * Every handler is wrapped in `route()` so that error -> status mapping lives
 * in exactly one place. Without that, each handler invents its own try/catch
 * and the failure modes drift — which is how a 403 quietly becomes a 500 that
 * leaks a stack trace, or an authorization error becomes a 200 with an empty
 * body.
 */

/** Mongo duplicate key. The old code branched on Postgres SQLSTATE 23505. */
const DUPLICATE_KEY = 11000

export function json(data, init) {
    return Response.json(data, init)
}

export function noContent() {
    return new Response(null, { status: 204 })
}

/**
 * Wrap a handler with uniform error mapping.
 *
 *   export const GET = route(async (req, { params }) => { ... })
 */
export function route(handler) {
    return async function wrapped(request, context) {
        try {
            return await handler(request, context)
        } catch (err) {
            return toResponse(err)
        }
    }
}

export function toResponse(err) {
    if (err instanceof AuthError) {
        return Response.json({ error: err.message }, { status: err.status })
    }

    // Unique-index violations are expected control flow for slugs and invites,
    // not server faults. Surface a 409 the client can act on.
    if (err?.code === DUPLICATE_KEY) {
        return Response.json(
            { error: 'Already exists', code: 'duplicate', field: duplicateField(err) },
            { status: 409 }
        )
    }

    // Repos attach `status` for domain errors (413 oversized draft, 409 last
    // owner). Anything without one is a genuine bug.
    if (typeof err?.status === 'number' && err.status < 500) {
        return Response.json({ error: err.message }, { status: err.status })
    }

    console.error('Unhandled route error:', err)
    return Response.json({ error: 'Internal error' }, { status: 500 })
}

/** Best-effort field name out of an E11000 message, for a useful client error. */
function duplicateField(err) {
    const key = err?.keyPattern && Object.keys(err.keyPattern)
    if (key?.length) return key.join('+')
    const m = /index:\s+(\S+?)_/.exec(err?.message ?? '')
    return m?.[1] ?? null
}

/** Parse and require a JSON body. */
export async function body(request) {
    try {
        const parsed = await request.json()
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('Body must be a JSON object')
        }
        return parsed
    } catch {
        const err = new Error('Invalid JSON body')
        err.status = 400
        throw err
    }
}

/** Require a non-empty string field. */
export function str(value, field, { max = 500 } = {}) {
    if (typeof value !== 'string' || !value.trim()) {
        throw badRequest(`${field} is required`)
    }
    if (value.length > max) throw badRequest(`${field} is too long`)
    return value.trim()
}

/**
 * Require an array of non-empty strings.
 *
 * Ids arrive from JSON bodies and flow straight into Mongo filters, so a
 * caller could otherwise smuggle `{$ne: null}` into an `$in` and widen the
 * query. Rejecting non-strings here is what stops that.
 */
export function strArray(value, field, { max = 500 } = {}) {
    if (!Array.isArray(value)) throw badRequest(`${field} must be an array`)
    if (value.length > max) throw badRequest(`${field} has too many entries`)
    if (!value.every((v) => typeof v === 'string' && v)) {
        throw badRequest(`${field} must contain only non-empty strings`)
    }
    return value
}

export function oneOf(value, allowed, field) {
    if (!allowed.includes(value)) {
        throw badRequest(`${field} must be one of: ${allowed.join(', ')}`)
    }
    return value
}

export function badRequest(message) {
    const err = new Error(message)
    err.status = 400
    return err
}

export function notFoundResponse(message = 'Not found') {
    return Response.json({ error: message }, { status: 404 })
}
