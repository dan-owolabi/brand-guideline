import { route, json, body, str, strArray } from '@/server/http'
import { requireBrandRole } from '@/server/auth/guard'
import * as collections from '@/server/db/repos/collections'

/**
 * POST /api/collections/reorder — persist a new section order.
 *
 * Body: { brandId, orderedIds: [...] }
 *
 * The Supabase version issued one UPDATE per row inside a loop
 * (AssetsPage.jsx:270), so dragging a section in a ten-section brand fired ten
 * sequential requests and left the list visibly inconsistent if one failed
 * partway. This is a single bulkWrite.
 *
 * Each operation in that bulkWrite is filtered by accountId as well as _id, so
 * a forged id list cannot reorder another tenant's sections — the ids come
 * straight from a request body, and strArray() blocks non-strings from
 * reaching the filter as query operators.
 */
export const POST = route(async (request) => {
    const input = await body(request)
    const brandId = str(input.brandId, 'brandId')
    const orderedIds = strArray(input.orderedIds, 'orderedIds')

    const ctx = await requireBrandRole(request, brandId, 'editor')

    const modified = await collections.reorder(ctx, orderedIds)
    return json({ modified })
})
