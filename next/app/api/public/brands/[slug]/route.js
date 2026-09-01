import { route, json, notFoundResponse } from '@/server/http'
import * as publicRepo from '@/server/db/repos/public'

/**
 * GET /api/public/brands/:slug — UNAUTHENTICATED.
 *
 * The anonymous read path for {slug}.guidr.space. Everything it returns comes
 * from repos/public.js, which projects a fixed allowlist — there is no column
 * parameter a caller could widen. That is the structural fix for the Supabase
 * leak where `?select=draft` returned every published account's unpublished
 * drafts.
 *
 * `?view=assets` additionally returns collections and assets, scoped to
 * brands that are themselves published (not merely owned by a published
 * account — the account-level scoping in Supabase migration 007 exposed
 * unpublished siblings' files).
 */
export const GET = route(async (request, { params }) => {
    const { slug } = await params
    const wantAssets = new URL(request.url).searchParams.get('view') === 'assets'

    const brand = await publicRepo.getBrandBySlug(slug)
    if (!brand) return notFoundResponse('Brand not found')

    if (!wantAssets) return json({ brand })

    // published === null means the brand exists but was never published; the
    // UI renders "not published yet" rather than a 404, so return the brand
    // with empty content instead of failing.
    const content = await publicRepo.getPublishedBrandContent(brand._id)
    return json({
        brand,
        collections: content?.collections ?? [],
        assets: content?.assets ?? [],
    })
})
