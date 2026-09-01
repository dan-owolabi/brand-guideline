import { route, json, notFoundResponse } from '@/server/http'
import * as invites from '@/server/db/repos/invites'

/**
 * GET /api/invites/:token — UNAUTHENTICATED.
 *
 * Renders the accept screen for someone who is not signed in yet, so it cannot
 * require a session. That makes it the most exposed route in the app, and the
 * projection is correspondingly minimal: account name, logo, role, expiry.
 * Never the invite row, never the invitee's email, never invitedBy, never the
 * account id.
 *
 * Supabase had `FOR SELECT USING (true)` on account_invites (migration 003),
 * so anyone could enumerate and read every invite in the system. Here there is
 * no generic read at all — only this fixed shape, keyed by an unguessable
 * token.
 */
export const GET = route(async (_request, { params }) => {
    const { token } = await params

    const invite = await invites.getPublicByToken(token)

    // Unknown, expired and revoked are deliberately indistinguishable: any
    // difference would let someone probe which tokens once existed.
    if (!invite) return notFoundResponse('This invite is invalid or has expired')

    return json({ invite })
})
