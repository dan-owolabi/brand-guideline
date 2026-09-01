import { route, json, body, str, oneOf, noContent, badRequest } from '@/server/http'
import { requireAccountRole, requireSession } from '@/server/auth/guard'
import * as invites from '@/server/db/repos/invites'
import * as accounts from '@/server/db/repos/accounts'
import { sendInvite } from '@/server/email'

/** GET /api/accounts/:id/invites — pending invites. Owner only, tokens stripped. */
export const GET = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await requireAccountRole(request, id, 'owner')
    return json({ invites: await invites.listForAccount(ctx) })
})

/**
 * POST /api/accounts/:id/invites — create an invite and email it.
 *
 * The Supabase version called GoTrue /auth/v1/invite with the ANON key
 * (in the since-deleted src/lib/supabase.js). That endpoint requires a service_role JWT, so it
 * returned 401 and AccountSettings.jsx:503 swallowed the error — invites only
 * ever worked via the copy-link path. There was nothing to preserve.
 *
 * Delivery now goes through Resend (src/server/email.js), chosen over SES
 * because guidr.space was already DKIM-verified with Resend before this
 * migration started.
 */
export const POST = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await requireAccountRole(request, id, 'owner')
    const input = await body(request)

    const email = str(input.email, 'email', { max: 254 }).toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return json({ error: 'Invalid email address' }, { status: 400 })
    }
    const role = oneOf(input.role ?? 'viewer', ['owner', 'editor', 'viewer'], 'role')

    // Inviting an existing member must not mint a live token. The membership
    // array stores only userId, so this has to resolve emails through Better
    // Auth's user collection — hence hasMemberWithEmail rather than a naive
    // scan of listMembers(), which has no email field at all.
    if (await accounts.hasMemberWithEmail(ctx, email)) {
        return json({ error: 'Already a member', code: 'already_member' }, { status: 409 })
    }

    // A duplicate pending invite raises E11000 from the partial unique index,
    // which http.js maps to 409 { code: 'duplicate' }.
    const invite = await invites.create(ctx, { email, role })

    /**
     * Send the invite, but never let delivery failure fail the request: the
     * invite row already exists and is valid, and sendInvite() swallows its own
     * errors. If mail does not arrive the owner can still copy the link, which
     * is the only path that ever worked under Supabase anyway.
     */
    const account = await accounts.get(ctx)
    // requireAccountRole returns only { userId, accountId, role } — the user
    // object is resolved but discarded. Re-resolving is cheap because the
    // session is cookie-cached, and it is the only way to name the inviter.
    const { user } = await requireSession(request)
    const origin = new URL(request.url).origin

    await sendInvite({
        to: email,
        url: `${origin}/invite/${invite.token}`,
        accountName: account?.name || 'a workspace',
        inviterName: user?.name || user?.email || null,
        role,
    })

    // The token is still returned so the copy-link fallback keeps working. It
    // is deliberately absent from the GET listing — a pending invite must not
    // be replayable by anyone who can merely read the list.
    return json({
        invite: { _id: invite._id, email: invite.email, role: invite.role, expiresAt: invite.expiresAt },
        inviteToken: invite.token,
    }, { status: 201 })
})

/**
 * DELETE /api/accounts/:id/invites?inviteId=… — revoke a pending invite.
 *
 * Marks it revoked rather than deleting it, so the partial unique index on
 * (accountId, email) WHERE status='pending' releases and the same person can
 * be re-invited, while the audit trail survives.
 */
export const DELETE = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await requireAccountRole(request, id, 'owner')

    const inviteId = new URL(request.url).searchParams.get('inviteId')
    if (!inviteId) throw badRequest('inviteId is required')

    const revoked = await invites.revoke(ctx, inviteId)
    if (!revoked) return json({ error: 'Invite not found' }, { status: 404 })

    return noContent()
})
