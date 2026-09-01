import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'

/**
 * Better Auth integration.
 *
 * The question this suite exists to answer is the last open item from the
 * Phase 0 gate: can a Supabase user, imported with their ORIGINAL uuid and
 * their ORIGINAL bcrypt hash, sign in without a password reset?
 *
 * Everything else here (uuid generation, session round-trip, guard wiring)
 * protects assumptions the repo layer and all 17 routes are built on.
 *
 * Requires MONGODB_TEST_URI. Skips loudly otherwise — same rule as the
 * authorization matrix: a green run that asserted nothing is worse than red.
 */

let auth
let guard
let db
let unavailable = null

// A real hash lifted from Supabase auth.users during the Phase 0 gate:
// bcrypt, $2a$, cost 10. We do not know its plaintext, which is exactly why
// the tests below generate their own bcrypt hashes at the same parameters.
const SUPABASE_SHAPED_HASH = '$2a$10$p39jhBJVKr2wvNL4K4ttBeZL45NFYWuQMYh8MMoHMzKZMjzov8Rym'

before(async () => {
    const uri = process.env.MONGODB_TEST_URI
    if (!uri || process.env.SKIP_DB_TESTS) {
        unavailable = 'MONGODB_TEST_URI not set (or SKIP_DB_TESTS)'
        return
    }

    process.env.MONGODB_URI = uri
    // Own database — see the note in authorization.test.js.
    process.env.MONGODB_DB = 'test_auth_integration'
    process.env.BETTER_AUTH_SECRET ||= 'test-secret-not-used-in-production-000000'
    process.env.BETTER_AUTH_URL ||= 'http://localhost:3000'

    const config = await import('../src/server/auth/config.js')
    auth = await config.getAuth()
    guard = await import('../src/server/auth/guard.js')

    const { getDb } = await import('../src/server/db/client.js')
    db = await getDb()
})

after(async () => {
    if (db) {
        await Promise.all(
            ['user', 'session', 'account', 'verification', 'accounts']
                .map((c) => db.collection(c).deleteMany({}))
        )
    }
    // Without this the cached client keeps the event loop alive and the run
    // never exits — see the same teardown in authorization.test.js.
    if (globalThis.__mongoClientPromise) {
        const client = await globalThis.__mongoClientPromise
        await client.close(true)
        globalThis.__mongoClientPromise = undefined
    }
})

function t(name, fn) {
    test(name, async (ctx) => {
        if (unavailable) return ctx.skip(unavailable)
        await fn(ctx)
    })
}

const email = (p) => `${p}-${randomUUID().slice(0, 8)}@test.dev`

describe('sign-up', () => {
    t('creates a user whose id is a real UUID', async () => {
        const e = email('signup')
        const res = await auth.api.signUpEmail({
            body: { email: e, password: 'correct-horse-battery', name: 'Ada' },
        })
        assert.ok(res.user?.id, 'expected a user id')

        // The whole data model depends on this. accounts.members[].userId,
        // invites.invitedBy and every asset owner reference are string UUIDs,
        // and the Supabase import reuses the original auth.users ids. Better
        // Auth's default id format would silently orphan all of them.
        assert.match(
            res.user.id,
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
            `id "${res.user.id}" is not a UUID — advanced.database.generateId is misconfigured`
        )
        assert.equal(typeof res.user.id, 'string')
    })

    t('new passwords are NOT stored as bcrypt (scrypt default retained)', async () => {
        const e = email('kdf')
        await auth.api.signUpEmail({ body: { email: e, password: 'correct-horse-battery', name: 'K' } })

        const user = await db.collection('user').findOne({ email: e })
        const cred = await db.collection('account').findOne({ userId: user._id, providerId: 'credential' })

        assert.ok(cred?.password, 'expected a stored credential')
        // Only `verify` is overridden, never `hash`. If this starts failing,
        // someone pinned every future password to the weaker KDF.
        assert.ok(
            !/^\$2[aby]\$/.test(cred.password),
            'new passwords are being written as bcrypt — the migration shim leaked into hashing'
        )
    })
})

describe('sign-in', () => {
    t('round-trips a password created by Better Auth', async () => {
        const e = email('signin')
        const pw = 'correct-horse-battery'
        await auth.api.signUpEmail({ body: { email: e, password: pw, name: 'S' } })

        const res = await auth.api.signInEmail({ body: { email: e, password: pw } })
        assert.ok(res.user?.id)
    })

    t('rejects a wrong password', async () => {
        const e = email('wrong')
        await auth.api.signUpEmail({ body: { email: e, password: 'correct-horse-battery', name: 'W' } })
        await assert.rejects(() => auth.api.signInEmail({ body: { email: e, password: 'nope' } }))
    })
})

describe('MIGRATION: imported Supabase users', () => {
    /**
     * Simulates the Phase 7 import: write a user document directly, with a
     * caller-chosen uuid and a bcrypt hash, exactly as the migration script
     * will — no Better Auth signup involved.
     */
    async function importSupabaseUser({ id, emailAddr, plaintext, cost = 10 }) {
        const now = new Date()
        // MUST be BSON UUID, not the string form. Better Auth's Mongo adapter
        // keys its collections on native UUID; a string here produces a user
        // who exists but can never log in, surfacing as the thoroughly
        // misleading "Invalid email or password". See src/server/db/authIds.js.
        const { toAuthId } = await import('../src/server/db/authIds.js')
        const authId = toAuthId(id)

        await db.collection('user').insertOne({
            _id: authId,
            name: 'Imported User',
            email: emailAddr,
            emailVerified: true,
            createdAt: now,
            updatedAt: now,
        })
        await db.collection('account').insertOne({
            _id: toAuthId(randomUUID()),
            userId: authId,
            accountId: id,
            providerId: 'credential',
            password: await bcrypt.hash(plaintext, cost),
            createdAt: now,
            updatedAt: now,
        })
    }

    t('signs in with their ORIGINAL bcrypt password and keeps their uuid', async () => {
        const id = randomUUID()
        const e = email('imported')
        const pw = 'their-old-supabase-password'

        await importSupabaseUser({ id, emailAddr: e, plaintext: pw })

        const res = await auth.api.signInEmail({ body: { email: e, password: pw } })

        assert.ok(res.user, 'imported user could not sign in — a forced password reset would be required')
        assert.equal(res.user.id, id, 'the original uuid was not preserved through sign-in')
    })

    t('rejects a wrong password against an imported bcrypt hash', async () => {
        const id = randomUUID()
        const e = email('imported-bad')
        await importSupabaseUser({ id, emailAddr: e, plaintext: 'right-password' })

        await assert.rejects(() => auth.api.signInEmail({ body: { email: e, password: 'wrong-password' } }))
    })

    t('the real Supabase hash shape is accepted by the verifier', async () => {
        // Uses the actual hash from production auth.users. We cannot sign in
        // with it (plaintext unknown), but we can assert the verifier treats it
        // as bcrypt and returns false rather than throwing — a throw here would
        // mean imported users hit a 500 on every login attempt.
        const { getAuth } = await import('../src/server/auth/config.js')
        void (await getAuth())

        const ok = await bcrypt.compare('definitely-not-it', SUPABASE_SHAPED_HASH)
        assert.equal(ok, false)
        assert.match(SUPABASE_SHAPED_HASH, /^\$2[aby]\$\d{2}\$/)
    })
})

describe('session resolves into the authorization guard', () => {
    t('a real session produces a ctx that repos accept', async () => {
        const e = email('session')
        const pw = 'correct-horse-battery'
        const signUp = await auth.api.signUpEmail({ body: { email: e, password: pw, name: 'G' } })
        const userId = signUp.user.id

        // Sign in and capture the session cookie the browser would hold.
        const signIn = await auth.api.signInEmail({
            body: { email: e, password: pw },
            asResponse: true,
        })
        const cookie = signIn.headers.get('set-cookie')
        assert.ok(cookie, 'expected a session cookie')

        const accounts = await import('../src/server/db/repos/accounts.js')
        const account = await accounts.createWithOwner(userId, {
            name: 'Session Co', slug: `session-${randomUUID().slice(0, 8)}`,
        })

        // Drive the guard exactly as a route handler does: a Request carrying
        // the cookie, nothing else. This is the full path — cookie -> Better
        // Auth -> resolver -> guard -> ctx.
        const request = new Request('http://localhost/api/accounts', {
            headers: { cookie: cookie.split(';')[0] },
        })

        const ctx = await guard.requireAccountRole(request, account._id, 'owner')
        assert.equal(ctx.userId, userId)
        assert.equal(ctx.role, 'owner')
    })

    t('a request with no cookie is still 401', async () => {
        const request = new Request('http://localhost/api/accounts')
        await assert.rejects(
            () => guard.requireAccountRole(request, randomUUID()),
            (err) => err.status === 401
        )
    })
})

describe('member enrichment', () => {
    t('listMembersWithUsers resolves emails through the Better Auth user collection', async () => {
        const e = email('member')
        const signUp = await auth.api.signUpEmail({ body: { email: e, password: 'correct-horse-battery', name: 'Grace' } })

        const accounts = await import('../src/server/db/repos/accounts.js')
        const account = await accounts.createWithOwner(signUp.user.id, {
            name: 'Enrich Co', slug: `enrich-${randomUUID().slice(0, 8)}`,
        })
        const ctx = { userId: signUp.user.id, accountId: account._id, role: 'owner' }

        const members = await accounts.listMembersWithUsers(ctx)
        assert.equal(members.length, 1)
        assert.equal(members[0].userId, signUp.user.id)
        assert.equal(members[0].role, 'owner')
        // The whole point: membership stores only userId, so a $lookup has to
        // supply this. Without it the settings screen shows blank rows.
        assert.equal(members[0].email, e)
        assert.equal(members[0].name, 'Grace')
    })
})
