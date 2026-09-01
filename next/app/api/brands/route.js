import { route, json, body, str, badRequest } from '@/server/http'
import { requireAccountRole } from '@/server/auth/guard'
import * as brands from '@/server/db/repos/brands'

/** GET /api/brands?accountId=… — brands in one account. */
export const GET = route(async (request) => {
    const accountId = new URL(request.url).searchParams.get('accountId')
    if (!accountId) throw badRequest('accountId is required')

    const ctx = await requireAccountRole(request, accountId, 'viewer')
    return json({ brands: await brands.listByAccount(ctx) })
})

/** POST /api/brands — editor or above. */
export const POST = route(async (request) => {
    const input = await body(request)
    const accountId = str(input.accountId, 'accountId')

    const ctx = await requireAccountRole(request, accountId, 'editor')

    const brand = await brands.create(ctx, {
        name: str(input.name, 'name', { max: 120 }),
        slug: str(input.slug, 'slug', { max: 63 }),
        logoUrl: input.logoUrl ?? null,
        primaryColor: input.primaryColor ?? null,
        fontFamily: input.fontFamily ?? null,
        bannerUrl: input.bannerUrl ?? null,
        draft: input.draft ?? undefined,
    })

    return json({ brand }, { status: 201 })
})
