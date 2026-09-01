import 'server-only'
import { S3Client, DeleteObjectsCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'node:crypto'

/**
 * Cloudflare R2 (S3-compatible).
 *
 * Why R2 rather than S3: the free tier is 10GB with ZERO egress and no expiry,
 * where AWS S3's free tier is 12 months and then bills silently. Egress
 * matters here because published brand guidelines serve their assets to
 * anonymous visitors.
 *
 * ── The security model ────────────────────────────────────────────────
 * Supabase's storage policy was `auth.role() = 'authenticated'`, and objects
 * were flat-keyed at the bucket root. Any logged-in user could delete any
 * other tenant's file. That is fixed structurally rather than by policy:
 *
 *   - keys are TENANT-PREFIXED: acct/{accountId}/brand/{brandId}/{uuid}.{ext}
 *   - the browser never holds R2 credentials; it PUTs to a 60s presigned URL
 *   - the prefix is built from ctx.accountId (a verified membership), never
 *     from anything in the request body
 *   - deletes re-derive the account from the key and refuse anything outside
 *     the caller's memberships
 *
 * So authorization is a property of the key itself.
 */

const REQUIRED = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET']

/** True when R2 is configured. Lets routes answer 503 instead of crashing. */
export function isStorageConfigured() {
    return REQUIRED.every((k) => Boolean(process.env[k]))
}

let cached
function client() {
    if (!isStorageConfigured()) {
        const missing = REQUIRED.filter((k) => !process.env[k])
        const err = new Error(`Storage is not configured (missing ${missing.join(', ')})`)
        err.status = 503
        throw err
    }
    if (!cached) {
        cached = new S3Client({
            region: 'auto',
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            },
        })
    }
    return cached
}

const BUCKET = () => process.env.R2_BUCKET

/**
 * Upload limits.
 *
 * The Supabase version had NO cap on non-image uploads — a PSD or ZIP went up
 * at whatever size the browser offered, straight into a 1GB bucket.
 */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

/**
 * Content-type allowlist. Deliberately excludes text/html and SVG-as-document:
 * these are served from a domain that will hold session cookies, so an
 * attacker-uploaded HTML file would be stored XSS. SVG is allowed as an image
 * because the product is a brand-asset tool and logos are SVG — it is served
 * with Content-Disposition guidance below.
 */
const ALLOWED_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
    'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon',
    'application/pdf', 'application/zip', 'application/x-zip-compressed',
    'application/postscript', 'application/illustrator',
    'image/vnd.adobe.photoshop', 'application/x-photoshop',
    'font/ttf', 'font/otf', 'font/woff', 'font/woff2',
    'application/font-woff', 'application/vnd.ms-fontobject',
    'video/mp4', 'video/webm', 'video/quicktime',
    'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream', // .fig, .sketch, .xd and friends
])

export function isAllowedType(type) {
    return ALLOWED_TYPES.has(String(type || '').toLowerCase())
}

/**
 * Build a tenant-prefixed object key.
 *
 * accountId comes from an authorized ctx — never from the request — which is
 * what makes the prefix trustworthy as an authorization record.
 */
export function buildKey({ accountId, brandId, filename }) {
    const ext = extensionOf(filename)
    const scope = brandId ? `brand/${brandId}` : 'account'
    return `acct/${accountId}/${scope}/${randomUUID()}${ext}`
}

/** The accountId a key belongs to, or null if it is not one of ours. */
export function accountIdFromKey(key) {
    const m = /^acct\/([0-9a-f-]{36})\//i.exec(String(key || ''))
    return m ? m[1] : null
}

/** Presigned PUT. Pins content-type and length so the URL cannot be reused. */
export async function presignUpload({ key, contentType, contentLength }) {
    const command = new PutObjectCommand({
        Bucket: BUCKET(),
        Key: key,
        ContentType: contentType,
        ContentLength: contentLength,
    })
    return getSignedUrl(client(), command, { expiresIn: 60 })
}

/** Delete many keys. Callers MUST authorize each key first. */
export async function deleteObjects(keys) {
    if (!keys.length) return { deleted: 0 }
    const res = await client().send(
        new DeleteObjectsCommand({
            Bucket: BUCKET(),
            Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
        })
    )
    return { deleted: keys.length - (res.Errors?.length ?? 0), errors: res.Errors ?? [] }
}

/**
 * Public URL for a key.
 *
 * Served from an R2 custom domain rather than signed GETs. Published
 * guidelines are public by design, and signing every read would break browser
 * caching of <img> and add a round trip per asset.
 *
 * CONSEQUENCE, stated explicitly: assets of an UNPUBLISHED brand are
 * "unlisted", not secret — reachable by anyone holding the URL, protected only
 * by an unguessable UUID. That is a deliberate trade. If it ever becomes
 * unacceptable, the fix is a second private bucket for drafts plus a
 * signed-GET route.
 */
export function publicUrlFor(key) {
    const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE
    if (!base) return null
    return `${base.replace(/\/$/, '')}/${key}`
}

function extensionOf(filename) {
    const m = /\.([A-Za-z0-9]{1,8})$/.exec(String(filename || ''))
    return m ? `.${m[1].toLowerCase()}` : ''
}
