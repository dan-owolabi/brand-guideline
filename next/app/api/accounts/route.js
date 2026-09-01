import { route, json, body, str } from '@/server/http'
import { requireSession } from '@/server/auth/guard'
import * as accounts from '@/server/db/repos/accounts'

/** GET /api/accounts — accounts the caller belongs to, each with their role. */
export const GET = route(async (request) => {
    const { userId } = await requireSession(request)
    return json({ accounts: await accounts.listForUser(userId) })
})

/**
 * POST /api/accounts — create an account with the caller as owner.
 *
 * No ctx guard: there is no account to be a member of yet. This is the one
 * legitimate authenticated-but-unscoped write, and it is why Postgres needed
 * migration 006's bootstrap INSERT policy. Embedding members[] removes the
 * chicken-and-egg problem — the owner exists the moment the document does.
 */
export const POST = route(async (request) => {
    const { userId } = await requireSession(request)
    const input = await body(request)

    const account = await accounts.createWithOwner(userId, {
        name: str(input.name, 'name', { max: 120 }),
        slug: str(input.slug, 'slug', { max: 63 }),
        logoUrl: input.logoUrl ?? null,
        billingEmail: input.billingEmail ?? null,
    })

    // A duplicate slug raises E11000, which http.js maps to 409 { code:
    // 'duplicate' } — the replacement for the old Postgres 23505 branch.
    return json({ account }, { status: 201 })
})
