import { route, json, body, str, badRequest } from '@/server/http'
import { requireAccountRole } from '@/server/auth/guard'
import {
    buildKey, presignUpload, publicUrlFor,
    isAllowedType, isStorageConfigured, MAX_UPLOAD_BYTES,
} from '@/server/storage/r2'

/**
 * POST /api/storage/presign
 *
 * Body: { accountId, brandId?, filename, contentType, contentLength }
 * Returns: { uploadUrl, key, publicUrl }
 *
 * The browser then PUTs the bytes straight to R2. Nothing large passes through
 * this server, and no R2 credential ever reaches the client.
 *
 * Every check that matters happens BEFORE the URL is issued, because once
 * signed it is a bearer token for that exact object:
 *   - membership at editor level or above
 *   - content-type allowlist
 *   - size cap (absent entirely in the Supabase version for non-images)
 *   - the key prefix is derived from ctx.accountId, never from the request
 */
export const POST = route(async (request) => {
    if (!isStorageConfigured()) {
        return json(
            { error: 'File storage is not configured yet', code: 'storage_unconfigured' },
            { status: 503 }
        )
    }

    const input = await body(request)
    const accountId = str(input.accountId, 'accountId')

    // Editor, not viewer: uploading is a write.
    const ctx = await requireAccountRole(request, accountId, 'editor')

    const filename = str(input.filename, 'filename', { max: 400 })
    const contentType = str(input.contentType, 'contentType', { max: 200 })
    const contentLength = Number(input.contentLength)

    if (!Number.isInteger(contentLength) || contentLength <= 0) {
        throw badRequest('contentLength must be a positive integer')
    }
    if (contentLength > MAX_UPLOAD_BYTES) {
        return json(
            {
                error: `File is too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024}MB)`,
                code: 'too_large',
            },
            { status: 413 }
        )
    }
    if (!isAllowedType(contentType)) {
        return json(
            { error: `Files of type "${contentType}" are not allowed`, code: 'type_not_allowed' },
            { status: 415 }
        )
    }

    // brandId is only a path segment for organising objects; authorization is
    // the account prefix, so a wrong brandId cannot cross a tenant boundary.
    const key = buildKey({
        accountId: ctx.accountId,
        brandId: typeof input.brandId === 'string' ? input.brandId : null,
        filename,
    })

    const uploadUrl = await presignUpload({ key, contentType, contentLength })

    return json({ uploadUrl, key, publicUrl: publicUrlFor(key) })
})
