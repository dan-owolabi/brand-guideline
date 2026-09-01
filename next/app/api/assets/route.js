import { route, json, body, str } from '@/server/http'
import { requireBrandRole } from '@/server/auth/guard'
import * as assets from '@/server/db/repos/assets'

/**
 * POST /api/assets — record uploaded files (or create folders).
 *
 * Accepts either a single `asset` or an `assets` array, because the paste and
 * multi-upload flows in AssetsPage add many at once and one request per file
 * would be dozens of round trips.
 *
 * This route only writes METADATA. Bytes go straight from the browser to R2
 * via a presigned PUT (Phase 6), so nothing large passes through here.
 */
export const POST = route(async (request) => {
    const input = await body(request)
    const brandId = str(input.brandId, 'brandId')

    const ctx = await requireBrandRole(request, brandId, 'editor')

    const incoming = Array.isArray(input.assets)
        ? input.assets
        : [input.asset ?? input]

    const normalized = incoming.map((a) => ({
        _id: a._id ?? a.id,
        brandId: ctx.brandId,
        collectionId: a.collectionId ?? null,
        parentId: a.parentId ?? null,
        name: str(a.name, 'name', { max: 400 }),
        fileKey: a.fileKey ?? null,
        fileUrl: a.fileUrl ?? null,
        thumbnailUrl: a.thumbnailUrl ?? null,
        fileType: a.fileType ?? null,
        fileSize: typeof a.fileSize === 'number' ? a.fileSize : null,
        category: a.category ?? 'other',
        isFolder: Boolean(a.isFolder),
    }))

    const created = normalized.length === 1
        ? [await assets.create(ctx, normalized[0])]
        : await assets.createMany(ctx, normalized)

    return json({ assets: created }, { status: 201 })
})
