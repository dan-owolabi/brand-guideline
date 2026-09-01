import { route, json, body, str, strArray, oneOf } from '@/server/http'
import { requireBrandRole } from '@/server/auth/guard'
import * as assets from '@/server/db/repos/assets'

/**
 * POST /api/assets/bulk — multi-select operations.
 *
 * Body: { brandId, op: 'move' | 'delete', ids: [...], collectionId?, parentId? }
 *
 * Drag-and-drop and multi-select delete both act on many rows at once. Doing
 * them one request per asset would be slow and could half-apply.
 */
export const POST = route(async (request) => {
    const input = await body(request)

    const brandId = str(input.brandId, 'brandId')
    const op = oneOf(input.op, ['move', 'delete'], 'op')
    const ids = strArray(input.ids, 'ids')

    const ctx = await requireBrandRole(request, brandId, 'editor')

    if (op === 'move') {
        const modified = await assets.move(ctx, ids, {
            collectionId: input.collectionId === undefined ? undefined : input.collectionId,
            parentId: input.parentId === undefined ? undefined : input.parentId,
        })
        return json({ modified })
    }

    // Delete returns the R2 keys of the rows ACTUALLY removed — scoped to this
    // account by the repo. Passing foreign ids yields neither a deletion nor
    // their keys, so this response cannot be used to drive a cross-tenant
    // storage delete in the follow-up call.
    const { deletedCount, fileKeys } = await assets.removeMany(ctx, ids)

    // TODO(Phase 6): hand fileKeys to the R2 delete route. Until storage moves,
    // the old Supabase objects are cleaned up by the existing client code.
    return json({ deletedCount, fileKeys })
})
