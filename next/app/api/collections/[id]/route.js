import { route, json, body, str, notFoundResponse, badRequest } from '@/server/http'
import { requireAccountRole } from '@/server/auth/guard'
import * as collections from '@/server/db/repos/collections'
import * as assets from '@/server/db/repos/assets'

/**
 * Collections are addressed by their own id here, but authorization is always
 * by account. The body/query must therefore carry accountId so a ctx can be
 * built before anything is touched — the repo then re-filters on it, so a
 * mismatched pair simply matches nothing rather than acting on the wrong row.
 */
async function ctxFor(request) {
    const accountId =
        new URL(request.url).searchParams.get('accountId') ||
        (await request.clone().json().catch(() => ({})))?.accountId

    if (!accountId) throw badRequest('accountId is required')
    return requireAccountRole(request, accountId, 'editor')
}

/** PATCH /api/collections/:id — rename. */
export const PATCH = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await ctxFor(request)
    const input = await body(request)

    const collection = await collections.rename(ctx, id, str(input.name, 'name', { max: 120 }))
    if (!collection) return notFoundResponse('Collection not found')

    return json({ collection })
})

/**
 * DELETE /api/collections/:id — delete a section.
 *
 * Assets inside it are reparented to uncategorised rather than deleted.
 * Cascading the delete would destroy uploaded files as a side effect of a
 * layout change, which is not what "delete section" means to a user.
 */
export const DELETE = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await ctxFor(request)

    const orphaned = await assets.clearCollection(ctx, id, null)

    const deleted = await collections.remove(ctx, id)
    if (!deleted) return notFoundResponse('Collection not found')

    return json({ orphanedAssets: orphaned }, { status: 200 })
})
