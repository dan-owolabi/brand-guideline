import { route, json, body, str } from '@/server/http'
import { requireBrandRole } from '@/server/auth/guard'
import * as collections from '@/server/db/repos/collections'

/** GET /api/brands/:id/collections — ordered sections. */
export const GET = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await requireBrandRole(request, id, 'viewer')
    return json({ collections: await collections.listByBrand(ctx, ctx.brandId) })
})

/** POST /api/brands/:id/collections — create a section. Editor or above. */
export const POST = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await requireBrandRole(request, id, 'editor')
    const input = await body(request)

    const existing = await collections.listByBrand(ctx, ctx.brandId)

    const created = await collections.create(ctx, {
        brandId: ctx.brandId,
        name: str(input.name, 'name', { max: 120 }),
        // Append by default rather than trusting a client-supplied index, which
        // could collide with an existing order and make the list unstable.
        order: typeof input.order === 'number' ? input.order : existing.length,
    })

    return json({ collection: created }, { status: 201 })
})
