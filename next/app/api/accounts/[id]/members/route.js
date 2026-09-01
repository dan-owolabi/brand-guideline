import { route, json, noContent, badRequest } from '@/server/http'
import { requireAccountRole } from '@/server/auth/guard'
import * as accounts from '@/server/db/repos/accounts'

/**
 * GET /api/accounts/:id/members — owner only.
 *
 * The roster is not viewer-visible. On Supabase this route did not exist and
 * the client read account_members directly, then issued a SECOND query to
 * `users` because there was no FK embed to join through
 * (AccountSettings.jsx:443). Both round trips collapse into this one read.
 */
export const GET = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await requireAccountRole(request, id, 'owner')
    return json({ members: await accounts.listMembersWithUsers(ctx) })
})

/** DELETE /api/accounts/:id/members?userId=… — owner only. */
export const DELETE = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await requireAccountRole(request, id, 'owner')

    const userId = new URL(request.url).searchParams.get('userId')
    if (!userId) throw badRequest('userId is required')

    // Removing the last owner throws 409 from the repo, where the check is in
    // the update filter rather than a read-then-write — two concurrent removals
    // cannot both observe two owners and both succeed.
    const removed = await accounts.removeMember(ctx, userId)
    if (!removed) return json({ error: 'Not a member' }, { status: 404 })

    return noContent()
})

/** PATCH /api/accounts/:id/members — change a member's role. Owner only. */
export const PATCH = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await requireAccountRole(request, id, 'owner')
    const { userId, role } = await request.json().catch(() => ({}))

    if (!userId) throw badRequest('userId is required')
    if (!['owner', 'editor', 'viewer'].includes(role)) {
        throw badRequest('role must be owner, editor or viewer')
    }

    // Demoting yourself when you are the only owner would strand the account
    // with no one able to administer it.
    if (userId === ctx.userId && role !== 'owner') {
        const members = await accounts.listMembers(ctx)
        const owners = members.filter((m) => m.role === 'owner')
        if (owners.length <= 1) {
            return json({ error: 'Cannot demote the last owner' }, { status: 409 })
        }
    }

    await accounts.setMemberRole(ctx, userId, role)
    return json({ ok: true })
})
