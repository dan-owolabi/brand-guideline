'use client'

import { compressImage } from './imageCompressor'

/**
 * Client-side uploads, via presigned R2 PUTs.
 *
 * Replaces uploadFile/deleteFile from the former lib/supabase.js (deleted). The flow is now:
 *
 *   1. ask our server to presign a PUT (it authorizes and mints the key)
 *   2. PUT the bytes straight to R2 from the browser
 *   3. record the resulting key/url in Mongo via the assets API
 *
 * Step 2 never touches our server, so a 25MB upload does not occupy a
 * serverless invocation, and no R2 credential exists in the client bundle.
 *
 * SIGNATURE CHANGE, unavoidable: the old call was `uploadFile(file, 'media')`.
 * Keys are tenant-prefixed now, so the caller must say which tenant:
 *
 *   uploadFile(file, { accountId, brandId })
 *
 * The second argument used to be a bucket name. Passing a string is caught
 * loudly below rather than silently uploading to the wrong prefix.
 */

export async function uploadFile(file, options) {
    if (typeof options === 'string' || !options?.accountId) {
        throw new Error(
            'uploadFile(file, { accountId, brandId }) — the bucket-name argument is gone. ' +
            'Keys are tenant-prefixed and the account must be explicit.'
        )
    }

    const { accountId, brandId = null } = options

    // Images are downscaled before upload (max 1920px, q0.8). Keeps R2 usage
    // down and is why the 25MB server cap is generous rather than tight.
    const toUpload = file.type?.startsWith('image/') ? await compressImage(file) : file

    const presign = await fetch('/api/storage/presign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
            accountId,
            brandId,
            filename: toUpload.name || file.name,
            contentType: toUpload.type || 'application/octet-stream',
            contentLength: toUpload.size,
        }),
    })

    const meta = await presign.json().catch(() => null)
    if (!presign.ok) {
        throw new Error(meta?.error || `Could not start upload (${presign.status})`)
    }

    const put = await fetch(meta.uploadUrl, {
        method: 'PUT',
        // Must match exactly what was signed, or R2 rejects the signature.
        headers: { 'content-type': toUpload.type || 'application/octet-stream' },
        body: toUpload,
    })

    if (!put.ok) {
        throw new Error(`Upload failed (${put.status})`)
    }

    // Returns BOTH url and key. The old helper returned a bare URL string,
    // which was sufficient only because Supabase keys were the URL's last
    // path segment. Tenant-prefixed keys are not recoverable from the URL, so
    // deletion needs the key kept alongside — hence assets.file_key.
    return { url: meta.publicUrl, key: meta.key }
}

/**
 * Delete objects by KEY (not URL).
 *
 * The Supabase version did `url.split('/').pop()`, which worked only because
 * objects were flat-keyed at the bucket root. Tenant-prefixed keys cannot be
 * recovered that way, which is why assets carry a `file_key` column.
 */
export async function deleteFiles(keys) {
    const list = (Array.isArray(keys) ? keys : [keys]).filter(Boolean)
    if (!list.length) return { deleted: 0, refused: [] }

    const res = await fetch('/api/storage/delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ keys: list }),
    })

    const json = await res.json().catch(() => null)
    if (!res.ok) throw new Error(json?.error || `Delete failed (${res.status})`)
    return json
}

/** Back-compat single-key delete. */
export async function deleteFile(key) {
    return deleteFiles([key])
}

/** Category from a filename — unchanged from the Supabase helper. */
export function getFileCategory(filename) {
    const ext = filename?.split('.').pop()?.toLowerCase() || ''
    const categories = {
        image: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico', 'avif'],
        document: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx'],
        archive: ['zip', 'rar', '7z', 'tar', 'gz'],
        design: ['ai', 'psd', 'fig', 'sketch', 'xd', 'eps'],
        font: ['ttf', 'otf', 'woff', 'woff2', 'eot'],
    }
    for (const [category, extensions] of Object.entries(categories)) {
        if (extensions.includes(ext)) return category
    }
    return 'other'
}
