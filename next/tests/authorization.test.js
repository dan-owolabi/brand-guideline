import { test, describe, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

/**
 * THE AUTHORIZATION MATRIX.
 *
 * This is the most important suite in the migration. Moving off Postgres means
 * giving up RLS, which denied by default; authorization now lives in
 * application code, which leaks by default. Everything RLS was silently doing
 * has to be re-asserted here explicitly.
 *
 * Five personas — owner, editor, viewer, non-member, anonymous — against every
 * repo function that touches tenant data.
 *
 * Run with:  npm test
 * (needs --conditions=react-server so the `server-only` guard resolves to a
 * no-op instead of throwing.)
 *
 * NEEDS A REPLICA SET, because invites.accept uses a transaction. Two ways:
 *
 *   MONGODB_TEST_URI=mongodb+srv://...  npm test     <- preferred; Atlas M0 is
 *                                                       already a replica set
 *   npm test                                         <- falls back to an
 *                                                       ephemeral in-process
 *                                                       server if the binary
 *                                                       is available
 *
 * If neither is available the whole suite SKIPS rather than silently passing.
 * A green run that asserted nothing is the one outcome worse than a red one
 * for a suite whose entire job is proving tenant isolation.
 */

let replset
let repos = {}
let guard
let unavailable = null

const OTHER = {}   // a second tenant that must never be reachable
const T = {}       // the tenant under test

before(async () => {
    let uri = process.env.MONGODB_TEST_URI

    // Explicit opt-out for environments with no Mongo and no outbound network
    // (sandboxes, offline CI). Skips loudly rather than hanging on a download.
    if (!uri && process.env.SKIP_DB_TESTS) {
        unavailable = 'SKIP_DB_TESTS is set and MONGODB_TEST_URI is not'
        return
    }

    if (!uri) {
        try {
            const { MongoMemoryReplSet } = await import('mongodb-memory-server')
            // On a cold cache this downloads a mongod binary, and on a blocked
            // network it HANGS rather than rejecting — which would stall the
            // whole suite indefinitely. Bound it so we fall through to skip.
            replset = await withTimeout(
                MongoMemoryReplSet.create({
                    replSet: { count: 1, storageEngine: 'wiredTiger' },
                }),
                Number(process.env.MONGO_BOOT_TIMEOUT_MS || 90_000),
                'timed out starting an in-process mongod (binary download blocked?)'
            )
            uri = replset.getUri()
        } catch (err) {
            unavailable =
                'No Mongo available. Set MONGODB_TEST_URI to a replica set ' +
                `(an Atlas M0 works), or allow the mongod download. Cause: ${err.message}`
            return
        }
    }

    process.env.MONGODB_URI = uri
    // Each test FILE gets its own database. node:test runs files in parallel
    // child processes, and this suite's beforeEach does deleteMany({}) on
    // every collection — sharing one database means it wipes rows another
    // file just created, producing failures that vanish when run alone.
    process.env.MONGODB_DB = 'test_authz_matrix'

    // Imported after env is set — client.js reads it at module load.
    guard = await import('../src/server/auth/guard.js')
    repos.accounts = await import('../src/server/db/repos/accounts.js')
    repos.brands = await import('../src/server/db/repos/brands.js')
    repos.assets = await import('../src/server/db/repos/assets.js')
    repos.collections = await import('../src/server/db/repos/collections.js')
    repos.invites = await import('../src/server/db/repos/invites.js')
    repos.public = await import('../src/server/db/repos/public.js')
})

after(async () => {
    // client.js caches the MongoClient on globalThis so it survives HMR in
    // dev. Nothing in the app ever closes it — a serverless process is
    // supposed to keep it warm. Under node:test that open socket keeps the
    // event loop alive forever, so the run never exits and, because the
    // reporter only flushes at exit, produces NO output at all. Closing it
    // here is what makes the suite terminate.
    if (globalThis.__mongoClientPromise) {
        const client = await globalThis.__mongoClientPromise
        await client.close(true)
        globalThis.__mongoClientPromise = undefined
    }
    if (replset) await replset.stop()
})

function withTimeout(promise, ms, message) {
    let timer
    return Promise.race([
        promise.finally(() => clearTimeout(timer)),
        new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error(message)), ms)
        }),
    ])
}

/**
 * Wrap every test so an unavailable database SKIPS loudly instead of passing
 * vacuously. node:test's `skip` shows up in the summary; a silent no-op would
 * not.
 */
function t(name, fn) {
    test(name, async (ctx) => {
        if (unavailable) return ctx.skip(unavailable)
        await fn(ctx)
    })
}

/**
 * Seed two independent tenants before every test.
 *
 * Round trips dominate here: against a remote Atlas cluster each op costs
 * ~100-300ms, so seeding one document at a time (13 sequential ops × 41 tests)
 * pushed the suite past six minutes. Everything is therefore batched into two
 * parallel waves — one of deleteMany, one of insertMany — which is ~2 round
 * trips per test instead of ~13.
 */
beforeEach(async () => {
    if (unavailable) return
    const { getDb } = await import('../src/server/db/client.js')
    const db = await getDb()

    await Promise.all(
        ['accounts', 'brands', 'assets', 'collections', 'invites'].map((c) =>
            db.collection(c).deleteMany({})
        )
    )

    const acme = buildTenant('acme', { published: true })
    const globex = buildTenant('globex', { published: true })
    Object.assign(T, acme.ids)
    Object.assign(OTHER, globex.ids)

    await Promise.all([
        db.collection('accounts').insertMany([acme.account, globex.account]),
        db.collection('brands').insertMany([acme.brand, globex.brand]),
        db.collection('collections').insertMany([acme.collection, globex.collection]),
        db.collection('assets').insertMany([acme.asset, globex.asset]),
    ])

    // Every persona resolves to a userId; anonymous resolves to null.
    guard.setSessionResolver(async (req) => (req?.userId ? { userId: req.userId } : null))
})

/** Build (but do not insert) one tenant's documents. */
function buildTenant(slug, { published }) {
    const ids = {
        accountId: randomUUID(),
        owner: randomUUID(),
        editor: randomUUID(),
        viewer: randomUUID(),
        brandId: randomUUID(),
        collectionId: randomUUID(),
        assetId: randomUUID(),
    }

    return {
        ids,
        account: {
            _id: ids.accountId,
            name: slug,
            slug,
            isPublished: published,
            billingEmail: `billing@${slug}.test`,
            plan: 'free',
            members: [
                { userId: ids.owner, role: 'owner' },
                { userId: ids.editor, role: 'editor' },
                { userId: ids.viewer, role: 'viewer' },
            ],
        },
        brand: {
            _id: ids.brandId,
            accountId: ids.accountId,
            name: `${slug} brand`,
            slug: `${slug}-brand`,
            draft: { secret: `${slug} UNPUBLISHED DRAFT` },
            published: { tokens: {}, sections: [] },
        },
        collection: {
            _id: ids.collectionId,
            accountId: ids.accountId,
            brandId: ids.brandId,
            name: 'Logos',
            order: 0,
        },
        asset: {
            _id: ids.assetId,
            accountId: ids.accountId,
            brandId: ids.brandId,
            collectionId: ids.collectionId,
            name: 'logo.svg',
            fileKey: `acct/${ids.accountId}/brand/${ids.brandId}/logo.svg`,
        },
    }
}

/** Build a fake request for a persona. */
const as = (userId) => (userId ? { userId } : {})

/** Assert that obtaining a ctx fails with the given status. */
async function denied(fn, status) {
    await assert.rejects(fn, (err) => {
        assert.equal(err.status, status, `expected ${status}, got ${err.status}: ${err.message}`)
        return true
    })
}

// ───────────────────────────── guard ─────────────────────────────

describe('requireAccountRole', () => {
    t('anonymous is 401', async () => {
        await denied(() => guard.requireAccountRole(as(null), T.accountId), 401)
    })

    t('non-member gets 404, not 403 (no enumeration oracle)', async () => {
        // A 403 would confirm the account id exists. 404 reveals nothing.
        await denied(() => guard.requireAccountRole(as(randomUUID()), T.accountId), 404)
    })

    t('member of ANOTHER tenant cannot reach this one', async () => {
        await denied(() => guard.requireAccountRole(as(OTHER.owner), T.accountId), 404)
    })

    t('viewer is denied editor-level access', async () => {
        await denied(() => guard.requireAccountRole(as(T.viewer), T.accountId, 'editor'), 403)
    })

    t('editor is denied owner-level access', async () => {
        await denied(() => guard.requireAccountRole(as(T.editor), T.accountId, 'owner'), 403)
    })

    t('role hierarchy: owner satisfies every level', async () => {
        for (const level of ['viewer', 'editor', 'owner']) {
            const ctx = await guard.requireAccountRole(as(T.owner), T.accountId, level)
            assert.equal(ctx.role, 'owner')
            assert.equal(ctx.accountId, T.accountId)
        }
    })

    t('editor satisfies viewer and editor', async () => {
        for (const level of ['viewer', 'editor']) {
            assert.equal((await guard.requireAccountRole(as(T.editor), T.accountId, level)).role, 'editor')
        }
    })

    t('unknown account id is 404', async () => {
        await denied(() => guard.requireAccountRole(as(T.owner), randomUUID()), 404)
    })

    t('non-string account id cannot bypass via operator injection', async () => {
        // A JSON body could carry {$ne: null}; it must not become a filter.
        for (const bad of [null, undefined, 42, { $ne: null }, ['x']]) {
            await denied(() => guard.requireAccountRole(as(T.owner), bad), 404)
        }
    })
})

describe('requireBrandRole', () => {
    t('member of another tenant cannot reach this brand', async () => {
        await denied(() => guard.requireBrandRole(as(OTHER.owner), T.brandId), 404)
    })

    t('viewer denied editor level', async () => {
        await denied(() => guard.requireBrandRole(as(T.viewer), T.brandId, 'editor'), 403)
    })

    t('owner gets ctx carrying both ids', async () => {
        const ctx = await guard.requireBrandRole(as(T.owner), T.brandId, 'editor')
        assert.equal(ctx.accountId, T.accountId)
        assert.equal(ctx.brandId, T.brandId)
    })
})

// ─────────────────────── cross-tenant isolation ───────────────────────

describe('repos refuse to act outside ctx.accountId', () => {
    // A forged ctx is the worst case: a bug elsewhere hands a repo the right
    // user but the wrong account. Every filter must still hold.
    const forged = () => ({ userId: OTHER.owner, accountId: OTHER.accountId, role: 'owner' })

    t('brands.getById cannot read another tenant', async () => {
        assert.equal(await repos.brands.getById(forged(), T.brandId), null)
    })

    t('brands.getByIdOrSlug cannot read another tenant by slug', async () => {
        assert.equal(await repos.brands.getByIdOrSlug(forged(), 'acme-brand'), null)
    })

    t('brands.listByAccount returns only own brands', async () => {
        const list = await repos.brands.listByAccount(forged())
        assert.ok(list.every((b) => b.accountId === OTHER.accountId))
        assert.ok(!list.some((b) => b._id === T.brandId))
    })

    t('brands.saveDraft cannot overwrite another tenant', async () => {
        const res = await repos.brands.saveDraft(forged(), T.brandId, { hacked: true })
        assert.equal(res, null)

        const ctx = await guard.requireAccountRole(as(T.owner), T.accountId)
        const brand = await repos.brands.getById(ctx, T.brandId)
        assert.equal(brand.draft.secret, 'acme UNPUBLISHED DRAFT')
    })

    t('brands.remove cannot delete another tenant', async () => {
        assert.equal(await repos.brands.remove(forged(), T.brandId), false)
        const ctx = await guard.requireAccountRole(as(T.owner), T.accountId)
        assert.ok(await repos.brands.getById(ctx, T.brandId))
    })

    t('assets.removeMany ignores foreign ids and returns no foreign keys', async () => {
        const res = await repos.assets.removeMany(forged(), [T.assetId, OTHER.assetId])
        assert.equal(res.deletedCount, 1)
        assert.ok(!res.fileKeys.some((k) => k.includes(T.accountId)),
            'must never return another tenant’s R2 keys — that would drive a cross-tenant delete')
    })

    t('assets.move cannot relocate foreign assets', async () => {
        const moved = await repos.assets.move(forged(), [T.assetId], { collectionId: null })
        assert.equal(moved, 0)
    })

    t('collections.reorder cannot reorder foreign sections', async () => {
        const n = await repos.collections.reorder(forged(), [T.collectionId])
        assert.equal(n, 0)
    })

    t('accounts.update cannot modify another tenant', async () => {
        await repos.accounts.update(forged(), { name: 'pwned' })
        const ctx = await guard.requireAccountRole(as(T.owner), T.accountId)
        assert.equal((await repos.accounts.get(ctx)).name, 'acme')
    })
})

// ───────────────────────── public projections ─────────────────────────

describe('public repo never leaks draft or billing', () => {
    // This is the exact bug that was live on Supabase: the policy was
    // row-scoped but not column-scoped, so ?select=draft returned every
    // published account's unpublished drafts.
    t('getBrandBySlug omits draft', async () => {
        const brand = await repos.public.getBrandBySlug('acme-brand')
        assert.ok(brand, 'published brand should resolve')
        assert.equal(brand.draft, undefined, 'draft must never be projected')
    })

    t('getAccountBySlug omits billingEmail and plan', async () => {
        const account = await repos.public.getAccountBySlug('acme')
        assert.ok(account)
        assert.equal(account.billingEmail, undefined)
        assert.equal(account.plan, undefined)
    })

    t('brand in an UNPUBLISHED account is not reachable', async () => {
        const { getDb } = await import('../src/server/db/client.js')
        const db = await getDb()
        await db.collection('accounts').updateOne(
            { _id: T.accountId }, { $set: { isPublished: false } }
        )
        assert.equal(await repos.public.getBrandBySlug('acme-brand'), null)
        assert.equal(await repos.public.getAccountBySlug('acme'), null)
    })

    t('unpublished brand resolves but exposes no content', async () => {
        // Deliberate: the UI renders "not published yet" rather than a 404.
        const { getDb } = await import('../src/server/db/client.js')
        const db = await getDb()
        await db.collection('brands').updateOne({ _id: T.brandId }, { $set: { published: null } })

        const brand = await repos.public.getBrandBySlug('acme-brand')
        assert.ok(brand)
        assert.equal(brand.published, null)
        assert.equal(brand.draft, undefined)
    })

    t('getPublishedBrandContent refuses an unpublished brand', async () => {
        const { getDb } = await import('../src/server/db/client.js')
        const db = await getDb()
        await db.collection('brands').updateOne({ _id: T.brandId }, { $set: { published: null } })

        // Supabase migration 007 scoped assets by ACCOUNT, so publishing one
        // brand exposed unpublished siblings' files. Must not recur.
        assert.equal(await repos.public.getPublishedBrandContent(T.brandId), null)
    })

    t('published brand content strips internal accountId from rows', async () => {
        const result = await repos.public.getPublishedBrandContent(T.brandId)
        assert.ok(result)
        assert.equal(result.assets[0].accountId, undefined)
        assert.equal(result.collections[0].accountId, undefined)
    })
})

// ───────────────────────────── invites ─────────────────────────────

describe('invites', () => {
    t('public token lookup exposes only display fields', async () => {
        const ctx = await guard.requireAccountRole(as(T.owner), T.accountId, 'owner')
        const invite = await repos.invites.create(ctx, { email: 'new@test.dev', role: 'editor' })

        const pub = await repos.invites.getPublicByToken(invite.token)
        assert.deepEqual(Object.keys(pub).sort(),
            ['accountLogoUrl', 'accountName', 'expiresAt', 'role'])
        // Supabase allowed `FOR SELECT USING (true)` on the whole row.
        assert.equal(pub.email, undefined, 'must not disclose the invitee address')
        assert.equal(pub.invitedBy, undefined)
        assert.equal(pub.accountId, undefined)
    })

    t('unknown, expired and revoked tokens all return null', async () => {
        const ctx = await guard.requireAccountRole(as(T.owner), T.accountId, 'owner')
        assert.equal(await repos.invites.getPublicByToken(randomUUID()), null)
        assert.equal(await repos.invites.getPublicByToken(null), null)

        const invite = await repos.invites.create(ctx, { email: 'x@test.dev', role: 'viewer' })
        await repos.invites.revoke(ctx, invite._id)
        assert.equal(await repos.invites.getPublicByToken(invite.token), null)
    })

    t('accept adds membership atomically and is idempotent', async () => {
        const ctx = await guard.requireAccountRole(as(T.owner), T.accountId, 'owner')
        const invite = await repos.invites.create(ctx, { email: 'joiner@test.dev', role: 'editor' })
        const joiner = randomUUID()

        const first = await repos.invites.accept(invite.token, joiner)
        assert.equal(first.ok, true)
        assert.equal(first.accountId, T.accountId)

        // The new member can now authorize at their granted level.
        const joinerCtx = await guard.requireAccountRole(as(joiner), T.accountId, 'editor')
        assert.equal(joinerCtx.role, 'editor')

        // Replaying the token must not re-add or re-grant.
        const second = await repos.invites.accept(invite.token, joiner)
        assert.equal(second.ok, false)

        const members = await repos.accounts.listMembers(ctx)
        assert.equal(members.filter((m) => m.userId === joiner).length, 1)
    })

    t('revoke cannot touch another tenant’s invite', async () => {
        const tCtx = await guard.requireAccountRole(as(T.owner), T.accountId, 'owner')
        const invite = await repos.invites.create(tCtx, { email: 'a@test.dev', role: 'viewer' })

        const otherCtx = await guard.requireAccountRole(as(OTHER.owner), OTHER.accountId, 'owner')
        assert.equal(await repos.invites.revoke(otherCtx, invite._id), false)
    })

    t('duplicate pending invite raises E11000; re-invite after revoke succeeds', async () => {
        const ctx = await guard.requireAccountRole(as(T.owner), T.accountId, 'owner')
        const { getDb } = await import('../src/server/db/client.js')
        const db = await getDb()
        await db.collection('invites').createIndex(
            { accountId: 1, email: 1 },
            { unique: true, partialFilterExpression: { status: 'pending' }, name: 'pending_invite_unique' }
        )

        const first = await repos.invites.create(ctx, { email: 'dup@test.dev', role: 'viewer' })
        await assert.rejects(
            () => repos.invites.create(ctx, { email: 'dup@test.dev', role: 'viewer' }),
            (err) => err.code === 11000
        )

        await repos.invites.revoke(ctx, first._id)
        await assert.doesNotReject(
            () => repos.invites.create(ctx, { email: 'dup@test.dev', role: 'viewer' })
        )
    })
})

// ───────────────────────────── membership ─────────────────────────────

describe('membership safety', () => {
    t('listMembers projects only the caller’s own account', async () => {
        const ctx = await guard.requireAccountRole(as(T.owner), T.accountId, 'owner')
        const members = await repos.accounts.listMembers(ctx)
        assert.equal(members.length, 3)
    })

    t('listForUser attaches own role and hides the roster', async () => {
        const list = await repos.accounts.listForUser(T.viewer)
        assert.equal(list.length, 1)
        assert.equal(list[0].role, 'viewer')
        assert.equal(list[0].members, undefined, 'a viewer must not receive the member list')
        assert.equal(list[0]._id, T.accountId)
    })

    t('the last owner cannot be removed', async () => {
        const ctx = await guard.requireAccountRole(as(T.owner), T.accountId, 'owner')
        await assert.rejects(
            () => repos.accounts.removeMember(ctx, T.owner),
            (err) => err.status === 409
        )
    })

    t('an owner can be removed while another owner remains', async () => {
        const ctx = await guard.requireAccountRole(as(T.owner), T.accountId, 'owner')
        const second = randomUUID()
        await repos.accounts.addMember(ctx, second, 'owner')
        assert.equal(await repos.accounts.removeMember(ctx, T.owner), true)
        await denied(() => guard.requireAccountRole(as(T.owner), T.accountId), 404)
    })

    t('removed members immediately lose access', async () => {
        const ctx = await guard.requireAccountRole(as(T.owner), T.accountId, 'owner')
        await repos.accounts.removeMember(ctx, T.viewer)
        await denied(() => guard.requireAccountRole(as(T.viewer), T.accountId), 404)
    })

    t('createWithOwner installs the creator without a bootstrap policy', async () => {
        // On Postgres this needed migration 006's special-case INSERT policy.
        const userId = randomUUID()
        const account = await repos.accounts.createWithOwner(userId, { name: 'New', slug: 'new-co' })
        const ctx = await guard.requireAccountRole(as(userId), account._id, 'owner')
        assert.equal(ctx.role, 'owner')
    })
})

// ───────────────────────────── size guard ─────────────────────────────

describe('brand content size guard', () => {
    t('an oversized draft is rejected before it reaches Mongo', async () => {
        const ctx = await guard.requireAccountRole(as(T.owner), T.accountId, 'editor')
        const huge = { blob: 'x'.repeat(11 * 1024 * 1024) }
        await assert.rejects(
            () => repos.brands.saveDraft(ctx, T.brandId, huge),
            (err) => err.status === 413
        )
    })

    t('a normal draft saves', async () => {
        const ctx = await guard.requireAccountRole(as(T.owner), T.accountId, 'editor')
        const res = await repos.brands.saveDraft(ctx, T.brandId, { sections: [1, 2, 3] })
        assert.ok(res)
    })
})
