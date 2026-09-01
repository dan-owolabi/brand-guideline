import { route, json } from '@/server/http'
import { requireSession } from '@/server/auth/guard'
import * as invites from '@/server/db/repos/invites'

/**
 * POST /api/invites/:token/accept
 *
 * Requires a session — you must be signed in to be added to an account, and
 * the membership is granted to the SESSION user, never to an id supplied in
 * the body. Accepting a body-provided userId here would let anyone add
 * arbitrary users to any account they hold a token for.
 *
 * Replaces the `accept_invite` SECURITY DEFINER function from migration 003.
 * The repo wraps both writes in a transaction so the invite cannot be consumed
 * without the membership landing, or vice versa.
 */
export const POST = route(async (request, { params }) => {
    const { token } = await params
    const { userId } = await requireSession(request)

    const result = await invites.accept(token, userId)

    if (!result.ok) {
        const status = result.reason === 'already_used' ? 409 : 404
        const message =
            result.reason === 'already_used'
                ? 'This invite has already been used'
                : 'This invite is invalid or has expired'
        return json({ error: message, code: result.reason }, { status })
    }

    return json({ ok: true, accountId: result.accountId, role: result.role })
})
