'use client'

/**
 * Client -> /api fetch wrapper.
 *
 * Two deliberate compatibility choices, both to keep the Supabase swap a
 * mechanical diff across ~42 call sites rather than a rewrite:
 *
 *  1. Every function returns `{ data, error }`, the shape supabase-js used, so
 *     existing `if (error)` handling survives untouched.
 *
 *  2. Documents are mapped from the Mongo/camelCase model back to the
 *     snake_case field names the components already read (`logo_url`,
 *     `primary_color`, `file_url`, `_id` -> `id`). See the mappers at the
 *     bottom.
 *
 * The second one is a SHIM, not the destination. The server speaks camelCase;
 * only this file translates. Deleting it later is a find-and-replace over the
 * components plus removing the map* calls here — deliberately confined to one
 * place so that stays possible.
 *
 * `error` mirrors the supabase-js shape closely enough for existing branches:
 *   { message, status, code }
 * where `code` is 'duplicate' for unique-key violations — the replacement for
 * the Postgres '23505' checks in BrandsDashboard and AccountSettings.
 */

async function request(method, path, { body, signal } = {}) {
    try {
        const res = await fetch(path, {
            method,
            headers: body ? { 'content-type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined,
            // Session is a cookie; without this every request is anonymous.
            credentials: 'same-origin',
            signal,
        })

        if (res.status === 204) return { data: null, error: null }

        const payload = await res.json().catch(() => null)

        if (!res.ok) {
            return {
                data: null,
                error: {
                    message: payload?.error || `Request failed (${res.status})`,
                    status: res.status,
                    code: payload?.code ?? null,
                    field: payload?.field ?? null,
                },
            }
        }

        return { data: payload, error: null }
    } catch (err) {
        // Network failure or an aborted request — never a thrown exception at
        // the call site, so callers only ever branch on `error`.
        return {
            data: null,
            error: { message: err.message || 'Network error', status: 0, code: 'network' },
        }
    }
}

const get = (p, o) => request('GET', p, o)
const post = (p, body) => request('POST', p, { body })
const patch = (p, body) => request('PATCH', p, { body })
const put = (p, body) => request('PUT', p, { body })
const del = (p) => request('DELETE', p)

const qs = (params) => {
    const s = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    ).toString()
    return s ? `?${s}` : ''
}

/* ── accounts ───────────────────────────────────────────────────────── */

export const accountsApi = {
    async list() {
        const { data, error } = await get('/api/accounts')
        return { data: data?.accounts?.map(mapAccount) ?? null, error }
    },
    async create({ name, slug }) {
        const { data, error } = await post('/api/accounts', { name, slug })
        return { data: data?.account ? mapAccount(data.account) : null, error }
    },
    async update(accountId, patchBody) {
        const { data, error } = await patch(`/api/accounts/${accountId}`, unmapAccount(patchBody))
        return { data: data?.account ? mapAccount(data.account) : null, error }
    },
    async members(accountId) {
        const { data, error } = await get(`/api/accounts/${accountId}/members`)
        return { data: data?.members ?? null, error }
    },
    async removeMember(accountId, userId) {
        return del(`/api/accounts/${accountId}/members${qs({ userId })}`)
    },
    async setMemberRole(accountId, userId, role) {
        return patch(`/api/accounts/${accountId}/members`, { userId, role })
    },
    async invites(accountId) {
        const { data, error } = await get(`/api/accounts/${accountId}/invites`)
        return { data: data?.invites?.map(mapInvite) ?? null, error }
    },
    async createInvite(accountId, { email, role }) {
        const { data, error } = await post(`/api/accounts/${accountId}/invites`, { email, role })
        return {
            data: data ? { ...mapInvite(data.invite), token: data.inviteToken } : null,
            error,
        }
    },
}

/* ── invites (public) ───────────────────────────────────────────────── */

export const invitesApi = {
    async getByToken(token) {
        const { data, error } = await get(`/api/invites/${encodeURIComponent(token)}`)
        return { data: data?.invite ?? null, error }
    },
    async accept(token) {
        const { data, error } = await post(`/api/invites/${encodeURIComponent(token)}/accept`)
        return { data, error }
    },
    async revoke(accountId, inviteId) {
        return del(`/api/accounts/${accountId}/invites${qs({ inviteId })}`)
    },
}

/* ── public (no session) ────────────────────────────────────────────── */

export const publicApi = {
    /**
     * @param identifier brand slug, or the host for a custom domain
     * @param isCustomDomain which lookup to use
     * @param view 'guidelines' | 'assets' — 'assets' also returns collections
     */
    async getBrand(identifier, { isCustomDomain = false, view = 'guidelines' } = {}) {
        const base = isCustomDomain
            ? `/api/public/domain/${encodeURIComponent(identifier)}`
            : `/api/public/brands/${encodeURIComponent(identifier)}`

        const { data, error } = await get(`${base}${qs({ view })}`)
        if (error) return { data: null, error }

        return {
            data: {
                brand: mapBrand(data.brand),
                collections: (data.collections ?? []).map(mapCollection),
                assets: (data.assets ?? []).map(mapAsset),
            },
            error: null,
        }
    },
}

/* ── brands ─────────────────────────────────────────────────────────── */

export const brandsApi = {
    async listByAccount(accountId) {
        const { data, error } = await get(`/api/brands${qs({ accountId })}`)
        return { data: data?.brands?.map(mapBrand) ?? null, error }
    },
    async get(brandId) {
        const { data, error } = await get(`/api/brands/${brandId}`)
        return { data: data?.brand ? mapBrand(data.brand) : null, error }
    },
    async create(input) {
        const { data, error } = await post('/api/brands', { accountId: input.accountId, ...unmapBrand(input), draft: input.draft })
        return { data: data?.brand ? mapBrand(data.brand) : null, error }
    },
    async update(brandId, patchBody) {
        const { data, error } = await patch(`/api/brands/${brandId}`, unmapBrand(patchBody))
        return { data: data?.brand ? mapBrand(data.brand) : null, error }
    },
    async remove(brandId) {
        return del(`/api/brands/${brandId}`)
    },
    async transfer(brandId, targetAccountId) {
        const { data, error } = await put(`/api/brands/${brandId}`, { targetAccountId })
        return { data: data?.brand ? mapBrand(data.brand) : null, error }
    },
    /**
     * Autosave. Called on a ~1s debounce while editing, so it is deliberately
     * its own endpoint issuing a single $set rather than a full document PATCH.
     */
    async saveDraft(brandId, draft) {
        return put(`/api/brands/${brandId}/draft`, { draft })
    },
    async publish(brandId, { publishMode, slug } = {}) {
        const { data, error } = await post(`/api/brands/${brandId}/publish`, { publishMode, slug })
        return { data: data?.brand ?? null, error }
    },
}

/* ── collections & assets ───────────────────────────────────────────── */

export const collectionsApi = {
    async listByBrand(brandId) {
        const { data, error } = await get(`/api/brands/${brandId}/collections`)
        return { data: data?.collections?.map(mapCollection) ?? null, error }
    },
    async create(brandId, { name, order }) {
        const { data, error } = await post(`/api/brands/${brandId}/collections`, { name, order })
        return { data: data?.collection ? mapCollection(data.collection) : null, error }
    },
    async rename(collectionId, accountId, name) {
        const { data, error } = await patch(`/api/collections/${collectionId}`, { accountId, name })
        return { data: data?.collection ? mapCollection(data.collection) : null, error }
    },
    async remove(collectionId, accountId) {
        return del(`/api/collections/${collectionId}${qs({ accountId })}`)
    },
    /** One bulkWrite server-side, replacing the old per-row UPDATE loop. */
    async reorder(brandId, orderedIds) {
        return post('/api/collections/reorder', { brandId, orderedIds })
    },
}

export const assetsApi = {
    async listByBrand(brandId) {
        const { data, error } = await get(`/api/brands/${brandId}/assets`)
        return { data: data?.assets?.map(mapAsset) ?? null, error }
    },
    async create(brandId, assets) {
        const list = Array.isArray(assets) ? assets : [assets]
        const { data, error } = await post('/api/assets', { brandId, assets: list.map(unmapAsset) })
        return { data: data?.assets?.map(mapAsset) ?? null, error }
    },
    async rename(assetId, accountId, name) {
        const { data, error } = await patch(`/api/assets/${assetId}`, { accountId, name })
        return { data: data?.asset ? mapAsset(data.asset) : null, error }
    },
    async remove(assetId, accountId) {
        return del(`/api/assets/${assetId}${qs({ accountId })}`)
    },
    async bulkDelete(brandId, ids) {
        return post('/api/assets/bulk', { brandId, op: 'delete', ids })
    },
    async bulkMove(brandId, ids, { collectionId, parentId }) {
        return post('/api/assets/bulk', { brandId, op: 'move', ids, collectionId, parentId })
    },
}

/* ── mappers ────────────────────────────────────────────────────────────
 * Mongo/camelCase  <->  the snake_case shape the ported components read.
 * Delete these once the components are renamed; keeping the translation in
 * one file is what makes that a single, reviewable change.
 * ─────────────────────────────────────────────────────────────────────── */

function mapAccount(a) {
    if (!a) return a
    return {
        id: a._id,
        name: a.name,
        slug: a.slug,
        logo_url: a.logoUrl ?? null,
        is_published: a.isPublished ?? false,
        custom_domain: a.customDomain ?? null,
        billing_email: a.billingEmail ?? null,
        plan: a.plan ?? 'free',
        role: a.role ?? null,
    }
}

function unmapAccount(p = {}) {
    return dropUndefined({
        name: p.name,
        slug: p.slug,
        logoUrl: p.logo_url ?? p.logoUrl,
        isPublished: p.is_published ?? p.isPublished,
        customDomain: p.custom_domain ?? p.customDomain,
        billingEmail: p.billing_email ?? p.billingEmail,
    })
}

function mapBrand(b) {
    if (!b) return b
    return {
        id: b._id,
        account_id: b.accountId,
        name: b.name,
        slug: b.slug,
        logo_url: b.logoUrl ?? null,
        banner_url: b.bannerUrl ?? null,
        primary_color: b.primaryColor ?? null,
        font_family: b.fontFamily ?? null,
        custom_font_url: b.customFontUrl ?? null,
        draft: b.draft ?? null,
        published: b.published ?? null,
        created_at: b.createdAt ?? null,
        updated_at: b.updatedAt ?? null,
    }
}

function unmapBrand(p = {}) {
    return dropUndefined({
        name: p.name,
        slug: p.slug,
        logoUrl: p.logo_url ?? p.logoUrl,
        bannerUrl: p.banner_url ?? p.bannerUrl,
        primaryColor: p.primary_color ?? p.primaryColor,
        fontFamily: p.font_family ?? p.fontFamily,
        customFontUrl: p.custom_font_url ?? p.customFontUrl,
    })
}

function mapCollection(c) {
    if (!c) return c
    return {
        id: c._id,
        brand_id: c.brandId,
        name: c.name,
        order: c.order ?? 0,
    }
}

function mapAsset(a) {
    if (!a) return a
    return {
        id: a._id,
        brand_id: a.brandId,
        collection_id: a.collectionId ?? null,
        parent_id: a.parentId ?? null,
        name: a.name,
        file_key: a.fileKey ?? null,
        file_url: a.fileUrl ?? null,
        thumbnail_url: a.thumbnailUrl ?? null,
        file_type: a.fileType ?? null,
        file_size: a.fileSize ?? null,
        category: a.category ?? 'other',
        is_folder: Boolean(a.isFolder),
        created_at: a.createdAt ?? null,
    }
}

function unmapAsset(a = {}) {
    return dropUndefined({
        // Preserved so the copy-section flow can keep its client-built
        // parent/child id map intact. See assetId() in the assets repo.
        _id: a.id ?? a._id,
        name: a.name,
        collectionId: a.collection_id ?? a.collectionId,
        parentId: a.parent_id ?? a.parentId,
        fileKey: a.file_key ?? a.fileKey,
        fileUrl: a.file_url ?? a.fileUrl,
        thumbnailUrl: a.thumbnail_url ?? a.thumbnailUrl,
        fileType: a.file_type ?? a.fileType,
        fileSize: a.file_size ?? a.fileSize,
        category: a.category,
        isFolder: a.is_folder ?? a.isFolder,
    })
}

function mapInvite(i) {
    if (!i) return i
    return {
        id: i._id,
        account_id: i.accountId ?? null,
        email: i.email,
        role: i.role,
        status: i.status ?? 'pending',
        expires_at: i.expiresAt ?? null,
        created_at: i.createdAt ?? null,
    }
}

function dropUndefined(o) {
    return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined))
}
