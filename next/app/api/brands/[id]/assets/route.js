import { route, json } from '@/server/http'
import { requireBrandRole } from '@/server/auth/guard'
import * as assets from '@/server/db/repos/assets'

/** GET /api/brands/:id/assets — every asset in a brand. Members only. */
export const GET = route(async (request, { params }) => {
    const { id } = await params
    const ctx = await requireBrandRole(request, id, 'viewer')
    return json({ assets: await assets.listByBrand(ctx, ctx.brandId) })
})
