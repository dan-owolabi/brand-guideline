import { route, json, body, strArray } from '@/server/http'
import { requireSession, requireAccountRole } from '@/server/auth/guard'
import { accountIdFromKey, deleteObjects, isStorageConfigured } from '@/server/storage/r2'

/**
 * POST /api/storage/delete
 *
 * Body: { keys: [...] }
 *
 * THE cross-tenant fix. Supabase's `media` bucket policy was
 * `auth.role() = 'authenticated'` over a flat key space, so any signed-in user
 * could delete any other tenant's file.
 *
 * Here the account is re-derived from each KEY and checked against the
 * caller's memberships. A key outside them is skipped, never deleted — and
 * because keys are minted server-side from an authorized ctx (see
 * buildKey/presign), the prefix is a trustworthy record of ownership rather
 * than a client-supplied claim.
 *
 * Returns which keys were refused, so a partial request is visible rather than
 * looking like a success.
 */
export const POST = route(async (request) => {
    if (!isStorageConfigured()) {
        return json(
            { error: 'File storage is not configured yet', code: 'storage_unconfigured' },
            { status: 503 }
        )
    }

    await requireSession(request)

    const input = await body(request)
    const keys = strArray(input.keys, 'keys', { max: 200 })

    const allowed = []
    const refused = []

    // Cache per account so deleting 50 files from one brand is one membership
    // check, not 50.
    const checked = new Map()

    for (const key of keys) {
        const accountId = accountIdFromKey(key)
        if (!accountId) {
            // Not one of our tenant-prefixed keys — could be a legacy Supabase
            // object or something hand-crafted. Never delete it.
            refused.push(key)
            continue
        }

        if (!checked.has(accountId)) {
            try {
                await requireAccountRole(request, accountId, 'editor')
                checked.set(accountId, true)
            } catch {
                checked.set(accountId, false)
            }
        }

        if (checked.get(accountId)) allowed.push(key)
        else refused.push(key)
    }

    const result = allowed.length ? await deleteObjects(allowed) : { deleted: 0 }

    return json({ deleted: result.deleted ?? 0, refused })
})
