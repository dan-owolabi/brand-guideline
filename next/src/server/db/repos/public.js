import 'server-only'
import { getDb } from '../client.js'
import { COLLECTIONS, PUBLIC_BRAND_FIELDS, PUBLIC_ACCOUNT_FIELDS } from '../schema.js'

/**
 * Anonymous read paths. The ONLY repo module that takes no `ctx`.
 *
 * This is where the Supabase column-selection leak dies by construction. On
 * Postgres the public policy was row-scoped but not column-scoped, and
 * PostgREST let the caller pick columns — so `?select=draft` returned every
 * published account's unpublished drafts. Here the projection is fixed in
 * code and there is no column parameter to abuse. See PUBLIC_BRAND_FIELDS.
 *
 * Every function must:
 *   - project through PUBLIC_* field maps, never a bare find()
 *   - require the brand's ACCOUNT to be published
 *
 * Note the deliberate asymmetry with the account check: an unpublished brand
 * inside a published account still resolves (with published: null) so the UI
 * can render "not published yet" instead of a 404. No draft content is
 * exposed either way because `draft` is not in the projection.
 */

async function db() {
    return getDb()
}

/** Public brand by slug. Null unless the owning account is published. */
export async function getBrandBySlug(slug) {
    const d = await db()

    const brand = await d
        .collection(COLLECTIONS.brands)
        .findOne({ slug }, { projection: PUBLIC_BRAND_FIELDS })
    if (!brand) return null

    if (!(await isAccountPublished(brand.accountId))) return null
    return brand
}

/** Public brand for a custom domain (first brand of the owning account). */
export async function getBrandByCustomDomain(host) {
    const d = await db()
    const account = await d
        .collection(COLLECTIONS.accounts)
        .findOne(
            { customDomain: host, isPublished: true },
            { projection: PUBLIC_ACCOUNT_FIELDS }
        )
    if (!account) return null

    const brand = await d
        .collection(COLLECTIONS.brands)
        .findOne({ accountId: account._id }, { projection: PUBLIC_BRAND_FIELDS })

    return brand ?? null
}

/** Public account by slug. */
export async function getAccountBySlug(slug) {
    const d = await db()
    return d
        .collection(COLLECTIONS.accounts)
        .findOne({ slug, isPublished: true }, { projection: PUBLIC_ACCOUNT_FIELDS })
}

/**
 * Assets and collections for a PUBLISHED brand.
 *
 * Scoped at brand level, not account level. Supabase migration 007 scoped
 * these by account, which meant publishing one guideline exposed the uploaded
 * files of every unpublished sibling brand in the same account (fixed there by
 * migration 012). Reproducing the account-level scope here would reintroduce
 * that bug, so the brand must itself be published.
 */
export async function getPublishedBrandContent(brandId) {
    const d = await db()

    const brand = await d
        .collection(COLLECTIONS.brands)
        .findOne(
            { _id: brandId, published: { $ne: null } },
            { projection: PUBLIC_BRAND_FIELDS }
        )
    if (!brand) return null
    if (!(await isAccountPublished(brand.accountId))) return null

    const [collections, assets] = await Promise.all([
        d.collection(COLLECTIONS.collections)
            .find({ brandId }, { projection: { accountId: 0 } })
            .sort({ order: 1 })
            .toArray(),
        d.collection(COLLECTIONS.assets)
            .find({ brandId }, { projection: { accountId: 0 } })
            .sort({ createdAt: -1 })
            .toArray(),
    ])

    return { brand, collections, assets }
}

async function isAccountPublished(accountId) {
    const d = await db()
    const acct = await d
        .collection(COLLECTIONS.accounts)
        .findOne({ _id: accountId, isPublished: true }, { projection: { _id: 1 } })
    return Boolean(acct)
}
