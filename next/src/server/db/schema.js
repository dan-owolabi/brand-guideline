/**
 * Collection names, the role hierarchy, and index definitions.
 *
 * Deliberately dependency-free so scripts/create_indexes.js and the test
 * harness can import it without pulling in the driver or `server-only`.
 *
 * ID CONVENTION: every application document uses a STRING uuid `_id`, and
 * Better Auth is configured with generateId: "uuid" to match. Do not mix
 * string UUIDs and BSON UUIDs — a mismatch produces lookups that silently
 * return nothing rather than erroring. Phase 0 pins which form is in use.
 */

export const COLLECTIONS = {
    accounts: 'accounts',
    brands: 'brands',
    assets: 'assets',
    collections: 'collections',
    invites: 'invites',

    // Owned by Better Auth, not by us — never written here, only joined
    // against to resolve a userId to a display name/email. Singular because
    // the Mongo adapter's `usePlural` is left at its default of false.
    authUser: 'user',
}

/** owner > editor > viewer. Mirrors AuthContext.hasRole() on the client. */
export const ROLE_RANK = { owner: 3, editor: 2, viewer: 1 }

export function roleAtLeast(role, minimum) {
    return (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[minimum] ?? Infinity)
}

/**
 * Index definitions, applied idempotently by scripts/create_indexes.js.
 *
 * The two that carry real weight:
 *   accounts."members.userId" — every authorization check is this lookup, so
 *     it is on the hot path of literally every authenticated request.
 *   invites.expiresAt TTL     — replaces the status='expired' bookkeeping that
 *     migration 003 had to do by hand.
 */
export const INDEXES = {
    [COLLECTIONS.accounts]: [
        { key: { 'members.userId': 1 }, name: 'members_userId' },
        { key: { slug: 1 }, name: 'slug_unique', unique: true },
        {
            key: { customDomain: 1 },
            name: 'customDomain_unique',
            unique: true,
            // sparse: most accounts have no custom domain, and a unique index
            // over many nulls would collide.
            partialFilterExpression: { customDomain: { $type: 'string' } },
        },
    ],

    [COLLECTIONS.brands]: [
        { key: { accountId: 1 }, name: 'accountId' },
        {
            key: { slug: 1 },
            name: 'slug_unique',
            unique: true,
            // Partial, not plain-unique: at least one legacy brand has a NULL
            // slug, and a plain unique index allows only ONE null document —
            // so a second slug-less brand would fail the import with a
            // baffling duplicate-key error on a field that is empty.
            // A brand with no slug simply is not publicly addressable.
            partialFilterExpression: { slug: { $type: 'string' } },
        },
    ],

    [COLLECTIONS.assets]: [
        { key: { brandId: 1 }, name: 'brandId' },
        // accountId is denormalized onto assets so authorization never needs
        // a $lookup back through brands.
        { key: { accountId: 1 }, name: 'accountId' },
        { key: { brandId: 1, collectionId: 1 }, name: 'brandId_collectionId' },
    ],

    [COLLECTIONS.collections]: [
        { key: { brandId: 1, order: 1 }, name: 'brandId_order' },
        { key: { accountId: 1 }, name: 'accountId' },
    ],

    [COLLECTIONS.invites]: [
        { key: { token: 1 }, name: 'token_unique', unique: true },
        { key: { accountId: 1 }, name: 'accountId' },
        {
            key: { accountId: 1, email: 1 },
            name: 'pending_invite_unique',
            unique: true,
            // Only one PENDING invite per (account, email); revoked/accepted
            // rows may repeat, so re-inviting after revocation still works.
            partialFilterExpression: { status: 'pending' },
        },
        {
            key: { expiresAt: 1 },
            name: 'invite_ttl',
            // expireAfterSeconds: 0 => delete once expiresAt is in the past.
            expireAfterSeconds: 0,
        },
    ],
}

/**
 * brands.draft is rewritten wholesale on a ~1s debounce while editing. Mongo's
 * hard ceiling is 16MB; guard well below it so the failure is a clean 413
 * rather than a driver error mid-autosave.
 */
export const MAX_BRAND_CONTENT_BYTES = 10 * 1024 * 1024

/** Public projections. The ONLY shape anonymous callers ever receive. */
export const PUBLIC_BRAND_FIELDS = {
    _id: 1,
    accountId: 1,
    name: 1,
    slug: 1,
    logoUrl: 1,
    bannerUrl: 1,
    primaryColor: 1,
    published: 1,
    // `draft` is deliberately absent. This is the structural fix for the
    // column-selection leak that Supabase migration 010/011 patches: there is
    // no generic column parameter to abuse, because callers cannot choose.
}

export const PUBLIC_ACCOUNT_FIELDS = {
    _id: 1,
    name: 1,
    slug: 1,
    logoUrl: 1,
    customDomain: 1,
    // billingEmail and plan are deliberately absent.
}
