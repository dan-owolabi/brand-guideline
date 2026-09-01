import { route, json, body, str, notFoundResponse, badRequest } from '@/server/http'
import { requireAccountRole } from '@/server/auth/guard'
import * as assets from '@/server/db/repos/assets'

/**
 * Assets are addressed by their own id, but authorization is always by
 * account, so accountId must accompany the request. The repo re-filters on it,
 * so a mismatched pair matches nothing rather than touching the wrong row.
 */
async function ctxFor(request) {
    const accountId =
        new URL(request.url).searchParams.get('accountId') ||
        (await request.clone().json().catch(() => ({})))?.accountId

    if (!accountId) throw badRequest('accountId is required')
    return requireAccountRole(request, accountId, 'editor')
}

/** PATCH /api/assets/:id — rename. */
export const PATCH = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await ctxFor(request)
    const input = await body(request)

    const asset = await assets.rename(ctx, id, str(input.name, 'name', { max: 400 }))
    if (!asset) return notFoundResponse('Asset not found')

    return json({ asset })
})

/**
 * DELETE /api/assets/:id
 *
 * Returns the R2 key of the deleted row so the caller can clean up storage.
 * The key comes from the row the repo actually deleted under this ctx, never
 * from the request — that is what stops a forged id from yielding another
 * tenant's key.
 */
export const DELETE = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await ctxFor(request)

    const { deletedCount, fileKeys } = await assets.removeMany(ctx, [id])
    if (!deletedCount) return notFoundResponse('Asset not found')

    return json({ fileKey: fileKeys[0] ?? null })
})
