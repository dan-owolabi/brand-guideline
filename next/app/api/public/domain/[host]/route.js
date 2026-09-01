import { route, json, notFoundResponse } from '@/server/http'
import * as publicRepo from '@/server/db/repos/public'

/**
 * GET /api/public/domain/:host — UNAUTHENTICATED.
 *
 * Custom-domain entry point. Resolves the host to its owning published
 * account, then that account's brand — the two-step lookup PublicBrandApp used
 * to do client-side against `accounts` and `brands` directly.
 *
 * The host is normalised the same way it is on write (see the accounts PATCH
 * route): lowercased and portless, so this stays an indexed equality match.
 */
export const GET = route(async (request, { params }) => {
    const { host } = await params
    const wantAssets = new URL(request.url).searchParams.get('view') === 'assets'

    const normalized = decodeURIComponent(host).trim().toLowerCase().split(':')[0]

    const brand = await publicRepo.getBrandByCustomDomain(normalized)
    if (!brand) return notFoundResponse('No published brand for this domain')

    if (!wantAssets) return json({ brand })

    const content = await publicRepo.getPublishedBrandContent(brand._id)
    return json({
        brand,
        collections: content?.collections ?? [],
        assets: content?.assets ?? [],
    })
})
