import { route, json, badRequest, notFoundResponse } from '@/server/http'
import { requireBrandRole } from '@/server/auth/guard'
import * as brands from '@/server/db/repos/brands'

/**
 * PUT /api/brands/:id/draft — autosave.
 *
 * THE HOTTEST WRITE IN THE APP. useBrandEditor debounces this to roughly one
 * call per second while someone is typing, so it gets its own route rather
 * than riding on the generic PATCH:
 *
 *   - the repo issues a single targeted $set on `draft`, never a document
 *     replace, so a large brand does not get rewritten wholesale each tick
 *   - the response is projected down to { _id, updatedAt } instead of echoing
 *     back a multi-megabyte document once a second
 *   - the size guard returns a clean 413 well below Mongo's 16MB ceiling;
 *     without it the failure is an opaque driver error mid-typing
 */
export const PUT = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await requireBrandRole(request, id, 'editor')

    let payload
    try {
        payload = await request.json()
    } catch {
        throw badRequest('Invalid JSON body')
    }

    // The draft itself is an arbitrary content tree, but it must be an object —
    // a bare string or array would corrupt the editor on read-back.
    const draft = payload?.draft
    if (!draft || typeof draft !== 'object' || Array.isArray(draft)) {
        throw badRequest('draft must be an object')
    }

    const result = await brands.saveDraft(ctx, ctx.brandId, draft)
    if (!result) return notFoundResponse('Brand not found')

    return json({ savedAt: result.updatedAt })
})
