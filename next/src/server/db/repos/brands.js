import 'server-only'
import { randomUUID } from 'node:crypto'
import { getDb } from '../client.js'
import { COLLECTIONS, MAX_BRAND_CONTENT_BYTES } from '../schema.js'

/**
 * Brand repository.
 *
 * EVERY exported function takes `ctx` first and folds `ctx.accountId` into the
 * filter. There is no "find by id" that does not also constrain the account —
 * that is the invariant which replaces RLS. Public reads live in ./public.js
 * and are projection-limited.
 */

const EDITABLE = ['name', 'slug', 'logoUrl', 'bannerUrl', 'primaryColor', 'fontFamily', 'customFontUrl']

async function col() {
    return (await getDb()).collection(COLLECTIONS.brands)
}

/** All brands in the caller's account. */
export async function listByAccount(ctx) {
    return (await col())
        .find({ accountId: ctx.accountId })
        .sort({ updatedAt: -1 })
        .toArray()
}

/** One brand, scoped to the caller's account. Returns null if not theirs. */
export async function getById(ctx, brandId) {
    return (await col()).findOne({ _id: brandId, accountId: ctx.accountId })
}

/** Resolve by slug OR id, scoped. Mirrors the old id-or-slug sniff. */
export async function getByIdOrSlug(ctx, identifier) {
    return (await col()).findOne({
        accountId: ctx.accountId,
        $or: [{ _id: identifier }, { slug: identifier }],
    })
}

export async function create(ctx, input) {
    const now = new Date()
    const doc = {
        _id: randomUUID(),
        accountId: ctx.accountId,
        name: input.name,
        slug: input.slug,
        logoUrl: input.logoUrl ?? null,
        bannerUrl: input.bannerUrl ?? null,
        primaryColor: input.primaryColor ?? null,
        fontFamily: input.fontFamily ?? null,
        customFontUrl: null,
        draft: input.draft ?? { tokens: {}, sections: [] },
        published: null,
        createdAt: now,
        updatedAt: now,
    }
    // Duplicate slug surfaces as E11000 — the caller maps it the way the old
    // code mapped Postgres 23505.
    await (await col()).insertOne(doc)
    return doc
}

/** Patch scalar fields. Never touches draft/published — those have own paths. */
export async function update(ctx, brandId, patch) {
    const $set = { updatedAt: new Date() }
    for (const k of EDITABLE) {
        if (patch[k] !== undefined) $set[k] = patch[k]
    }
    const res = await (await col()).findOneAndUpdate(
        { _id: brandId, accountId: ctx.accountId },
        { $set },
        { returnDocument: 'after' }
    )
    return res
}

/**
 * Autosave. Called on a ~1s debounce during editing — the hottest write in the
 * app — so it is a targeted $set on one field, never a document replace.
 *
 * Size-guarded well below Mongo's 16MB ceiling. Without this the failure mode
 * is a driver error mid-autosave with no useful message; with it the route can
 * return a clean 413.
 */
export async function saveDraft(ctx, brandId, draft) {
    assertContentSize(draft, 'draft')
    const res = await (await col()).findOneAndUpdate(
        { _id: brandId, accountId: ctx.accountId },
        { $set: { draft, updatedAt: new Date() } },
        { returnDocument: 'after', projection: { _id: 1, updatedAt: 1 } }
    )
    return res
}

/** Copy draft -> published, optionally updating slug and publish mode. */
export async function publish(ctx, brandId, { publishMode, slug } = {}) {
    const brand = await getById(ctx, brandId)
    if (!brand) return null

    const published = { ...(brand.draft ?? {}) }
    if (publishMode) published.publishMode = publishMode
    assertContentSize(published, 'published')

    const $set = { published, updatedAt: new Date() }
    if (slug) $set.slug = slug

    return (await col()).findOneAndUpdate(
        { _id: brandId, accountId: ctx.accountId },
        { $set },
        { returnDocument: 'after' }
    )
}

export async function remove(ctx, brandId) {
    const res = await (await col()).deleteOne({ _id: brandId, accountId: ctx.accountId })
    return res.deletedCount === 1
}

/** Move a brand to another account. Caller must be owner of BOTH — routes enforce. */
export async function transferToAccount(ctx, brandId, targetAccountId) {
    return (await col()).findOneAndUpdate(
        { _id: brandId, accountId: ctx.accountId },
        { $set: { accountId: targetAccountId, updatedAt: new Date() } },
        { returnDocument: 'after' }
    )
}

function assertContentSize(value, label) {
    const bytes = Buffer.byteLength(JSON.stringify(value ?? null))
    if (bytes > MAX_BRAND_CONTENT_BYTES) {
        const err = new Error(
            `Brand ${label} is ${(bytes / 1024 / 1024).toFixed(1)}MB, over the ` +
            `${MAX_BRAND_CONTENT_BYTES / 1024 / 1024}MB limit`
        )
        err.status = 413
        throw err
    }
}
