import { route, json, notFoundResponse, oneOf } from '@/server/http'
import { requireBrandRole } from '@/server/auth/guard'
import * as brands from '@/server/db/repos/brands'

/**
 * POST /api/brands/:id/publish — copy draft into published.
 *
 * Editor-level. This is the moment content becomes anonymously readable, so
 * the copy happens server-side from the stored draft rather than from a body
 * the client supplies — otherwise a caller could publish arbitrary content
 * without it ever having been the draft.
 */
export const POST = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await requireBrandRole(request, id, 'editor')

    const input = await request.json().catch(() => ({}))

    const publishMode = input.publishMode
        ? oneOf(input.publishMode, ['guidelines', 'assets', 'both'], 'publishMode')
        : undefined

    const brand = await brands.publish(ctx, ctx.brandId, {
        publishMode,
        slug: typeof input.slug === 'string' && input.slug ? input.slug : undefined,
    })

    if (!brand) return notFoundResponse('Brand not found')

    return json({ brand: { _id: brand._id, slug: brand.slug, updatedAt: brand.updatedAt } })
})
