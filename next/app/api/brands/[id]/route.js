import { route, json, body, noContent, notFoundResponse } from '@/server/http'
import { requireBrandRole, requireAccountRole } from '@/server/auth/guard'
import * as brands from '@/server/db/repos/brands'

/** GET /api/brands/:id — full brand including draft. Members only. */
export const GET = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await requireBrandRole(request, id, 'viewer')

    // ctx.brandId is the RESOLVED id — `id` may have been a slug.
    const brand = await brands.getById(ctx, ctx.brandId)
    if (!brand) return notFoundResponse('Brand not found')

    return json({ brand, role: ctx.role })
})

/** PATCH /api/brands/:id — scalar fields only. Editor or above. */
export const PATCH = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await requireBrandRole(request, id, 'editor')
    const patch = await body(request)

    // Deliberately does not accept draft/published — those have dedicated
    // routes so the hot autosave path stays a single targeted $set and cannot
    // be smuggled through a generic patch.
    const brand = await brands.update(ctx, ctx.brandId, {
        name: patch.name,
        slug: patch.slug,
        logoUrl: patch.logoUrl,
        bannerUrl: patch.bannerUrl,
        primaryColor: patch.primaryColor,
        customFontUrl: patch.customFontUrl,
    })

    if (!brand) return notFoundResponse('Brand not found')
    return json({ brand })
})

/**
 * DELETE /api/brands/:id — owner only.
 *
 * Stricter than editor: deleting a brand destroys published content and every
 * asset reference under it, and there is no undo.
 */
export const DELETE = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await requireBrandRole(request, id, 'owner')

    const deleted = await brands.remove(ctx, ctx.brandId)
    if (!deleted) return notFoundResponse('Brand not found')

    return noContent()
})

/**
 * PUT /api/brands/:id — transfer to another account.
 *
 * Requires owner of BOTH sides. Checking only the source would let an owner
 * push a brand into an account they do not control; checking only the target
 * would let them pull one out of an account they do not control.
 */
export const PUT = route(async (request, { params }) => {
    const { id } = await params
    const { targetAccountId } = await body(request)

    const ctx = await requireBrandRole(request, id, 'owner')
    await requireAccountRole(request, targetAccountId, 'owner')

    const brand = await brands.transferToAccount(ctx, ctx.brandId, targetAccountId)
    if (!brand) return notFoundResponse('Brand not found')

    return json({ brand })
})
