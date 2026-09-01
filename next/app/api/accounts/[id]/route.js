import { route, json, body } from '@/server/http'
import { requireAccountRole } from '@/server/auth/guard'
import * as accounts from '@/server/db/repos/accounts'

/** GET /api/accounts/:id — full account, members included for owners only. */
export const GET = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await requireAccountRole(request, id, 'viewer')
    const account = await accounts.get(ctx)

    // The member roster is owner-only. A viewer gets the account without it.
    if (ctx.role !== 'owner' && account) delete account.members

    return json({ account, role: ctx.role })
})

/**
 * PATCH /api/accounts/:id — owner-only settings.
 *
 * isPublished and customDomain both change what anonymous visitors can reach,
 * so this is deliberately owner-level rather than editor.
 */
export const PATCH = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await requireAccountRole(request, id, 'owner')
    const patch = await body(request)

    const account = await accounts.update(ctx, {
        name: patch.name,
        logoUrl: patch.logoUrl,
        customDomain: normalizeDomain(patch.customDomain),
        isPublished: typeof patch.isPublished === 'boolean' ? patch.isPublished : undefined,
        billingEmail: patch.billingEmail,
    })

    return json({ account })
})

/**
 * Custom domains are matched against the Host header, which is lowercase and
 * portless. Normalising on write keeps the lookup a plain equality match.
 */
function normalizeDomain(value) {
    if (value === undefined) return undefined
    if (value === null || value === '') return null
    return String(value).trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0]
}
