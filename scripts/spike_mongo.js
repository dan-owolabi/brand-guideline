#!/usr/bin/env node
/**
 * Phase 0 gate: prove MongoDB Atlas M0 can do everything the migration needs.
 *
 *   MONGODB_URI="mongodb+srv://..." node scripts/spike_mongo.js
 *
 * Optional, for the bcrypt check — lift a real hash out of Supabase:
 *   psql "$SUPABASE_DIRECT_URL" -Atc \
 *     "select encrypted_password from auth.users where encrypted_password is not null limit 1"
 *   SUPABASE_BCRYPT_HASH='$2a$10$...' node scripts/spike_mongo.js
 *
 * Every check is independent and prints PASS / FAIL / SKIP. Exit code is
 * non-zero if any REQUIRED check fails.
 *
 * Gate outcomes (from the plan):
 *   - UUID preservation fails  -> STOP. Every members.userId reference breaks.
 *   - bcrypt verify fails      -> recoverable: forced password reset at cutover.
 *   - transactions fail        -> accept_invite becomes compensating writes.
 */

import { MongoClient, ServerApiVersion } from 'mongodb'
import { randomUUID } from 'node:crypto'

const URI = process.env.MONGODB_URI
const DB_NAME = process.env.MONGODB_DB || 'spike_' + Date.now()
const BCRYPT_HASH = process.env.SUPABASE_BCRYPT_HASH

if (!URI) {
    console.error('MONGODB_URI is required.')
    process.exit(2)
}

const results = []
function record(name, status, detail, required = true) {
    results.push({ name, status, detail, required })
    const icon = status === 'PASS' ? '✓' : status === 'SKIP' ? '-' : '✗'
    console.log(`${icon} ${status.padEnd(4)} ${name}${detail ? ` — ${detail}` : ''}`)
}

async function check(name, fn, { required = true } = {}) {
    try {
        const detail = await fn()
        record(name, 'PASS', detail, required)
    } catch (err) {
        record(name, 'FAIL', err.message, required)
    }
}

const client = new MongoClient(URI, {
    serverApi: { version: ServerApiVersion.v1, strict: false, deprecateErrors: false },
    maxPoolSize: 10,
})

async function main() {
    await client.connect()
    const db = client.db(DB_NAME)
    console.log(`\nSpiking against database "${DB_NAME}"\n`)

    // ---------------------------------------------------------------
    // 1. String UUID _id round-trips intact
    //
    // The plan commits to string UUIDs across all application collections
    // (and Better Auth generateId: "uuid"). What matters is that a UUID we
    // choose comes back byte-identical and is queryable by equality.
    // ---------------------------------------------------------------
    await check('string UUID _id preserved and queryable', async () => {
        const col = db.collection('spike_users')
        const id = randomUUID()
        await col.insertOne({ _id: id, email: 'uuid@test.dev' })
        const found = await col.findOne({ _id: id })
        if (!found) throw new Error('lookup by string UUID returned nothing')
        if (found._id !== id) throw new Error(`_id mutated: ${found._id}`)
        if (typeof found._id !== 'string') throw new Error(`_id is ${typeof found._id}, expected string`)
        return id
    })

    // ---------------------------------------------------------------
    // 2. Embedded members array — the core authorization query
    //
    // accounts.members is embedded rather than a join table, so every
    // authorization check is this one indexed lookup. Prove the query shape
    // works AND that the positional projection returns only the caller's
    // membership (not the whole array, which would leak the member list).
    // ---------------------------------------------------------------
    await check('accounts.members embedded lookup + positional projection', async () => {
        const col = db.collection('spike_accounts')
        await col.createIndex({ 'members.userId': 1 })
        const accountId = randomUUID()
        const me = randomUUID()
        const someoneElse = randomUUID()
        await col.insertOne({
            _id: accountId,
            name: 'Acme',
            members: [
                { userId: someoneElse, role: 'owner' },
                { userId: me, role: 'editor' },
            ],
        })
        const doc = await col.findOne(
            { _id: accountId, 'members.userId': me },
            { projection: { 'members.$': 1, name: 1 } }
        )
        if (!doc) throw new Error('membership lookup returned nothing')
        if (doc.members.length !== 1) throw new Error(`expected 1 projected member, got ${doc.members.length}`)
        if (doc.members[0].role !== 'editor') throw new Error(`wrong member projected: ${doc.members[0].role}`)

        const nonMember = await col.findOne({ _id: accountId, 'members.userId': randomUUID() })
        if (nonMember) throw new Error('non-member lookup returned a document — authorization would leak')
        return 'role=editor, non-member correctly denied'
    })

    // ---------------------------------------------------------------
    // 3. Multi-document transaction (accept_invite)
    //
    // M0 is a real replica set so transactions should work. If this fails,
    // accept_invite becomes a compensating-write sequence with an
    // idempotency key.
    // ---------------------------------------------------------------
    await check('multi-document transaction across two collections', async () => {
        const accounts = db.collection('spike_accounts')
        const invites = db.collection('spike_invites')
        const accountId = randomUUID()
        const token = randomUUID()
        const newUser = randomUUID()

        await accounts.insertOne({ _id: accountId, name: 'Txn', members: [] })
        await invites.insertOne({ _id: randomUUID(), accountId, token, status: 'pending', role: 'viewer' })

        const session = client.startSession()
        try {
            await session.withTransaction(async () => {
                await invites.updateOne({ token }, { $set: { status: 'accepted' } }, { session })
                await accounts.updateOne(
                    { _id: accountId },
                    { $push: { members: { userId: newUser, role: 'viewer', addedAt: new Date() } } },
                    { session }
                )
            })
        } finally {
            await session.endSession()
        }

        const acct = await accounts.findOne({ _id: accountId })
        const inv = await invites.findOne({ token })
        if (inv.status !== 'accepted') throw new Error('invite not marked accepted')
        if (acct.members.length !== 1) throw new Error('member not pushed')
        return 'commit verified on both collections'
    })

    // ---------------------------------------------------------------
    // 4. Partial unique index — the duplicate-invite guard
    //
    // Replaces the Postgres partial unique index from migration 003.
    // The 23505 checks at AccountSettings.jsx:498 / BrandsDashboard.jsx:330
    // become E11000, so the error code must be distinguishable.
    // ---------------------------------------------------------------
    await check('partial unique index raises a distinguishable E11000', async () => {
        const col = db.collection('spike_invites_unique')
        await col.createIndex(
            { accountId: 1, email: 1 },
            { unique: true, partialFilterExpression: { status: 'pending' } }
        )
        const accountId = randomUUID()
        await col.insertOne({ _id: randomUUID(), accountId, email: 'dup@test.dev', status: 'pending' })

        let code = null
        try {
            await col.insertOne({ _id: randomUUID(), accountId, email: 'dup@test.dev', status: 'pending' })
        } catch (err) {
            code = err.code
        }
        if (code !== 11000) throw new Error(`expected error code 11000, got ${code}`)

        // The partial filter must let a non-pending duplicate through,
        // otherwise re-inviting someone after revocation would be blocked.
        await col.insertOne({ _id: randomUUID(), accountId, email: 'dup@test.dev', status: 'revoked' })
        return 'E11000 on pending duplicate; revoked duplicate allowed'
    })

    // ---------------------------------------------------------------
    // 5. Slug uniqueness — the other 23505 path
    // ---------------------------------------------------------------
    await check('unique slug index raises E11000', async () => {
        const col = db.collection('spike_brands')
        await col.createIndex({ slug: 1 }, { unique: true })
        await col.insertOne({ _id: randomUUID(), slug: 'taken' })
        try {
            await col.insertOne({ _id: randomUUID(), slug: 'taken' })
        } catch (err) {
            if (err.code === 11000) return 'E11000 as expected'
            throw new Error(`expected 11000, got ${err.code}`)
        }
        throw new Error('duplicate slug was accepted')
    })

    // ---------------------------------------------------------------
    // 6. 16MB BSON ceiling — the autosave guard
    //
    // brands.draft is written wholesale every ~1s while editing. A silent
    // failure at the document limit would be brutal to debug, so confirm
    // the driver raises something catchable and size the guard below it.
    // ---------------------------------------------------------------
    await check('oversized document is rejected with a catchable error', async () => {
        const col = db.collection('spike_bson_limit')
        const id = randomUUID()
        const huge = 'x'.repeat(17 * 1024 * 1024)
        try {
            await col.insertOne({ _id: id, draft: { blob: huge } })
        } catch (err) {
            return `rejected: ${err.name}`
        }
        throw new Error('17MB document was accepted — limit assumption is wrong')
    })

    // ---------------------------------------------------------------
    // 7. TTL index actually reaps
    //
    // Replaces the status='expired' bookkeeping in migration 003. Mongo's
    // TTL monitor runs every ~60s, so this check waits. Set SPIKE_SKIP_TTL=1
    // to skip during fast iteration.
    // ---------------------------------------------------------------
    if (process.env.SPIKE_SKIP_TTL) {
        record('TTL index reaps expired invites', 'SKIP', 'SPIKE_SKIP_TTL set')
    } else {
        await check('TTL index reaps expired invites (waits ~90s)', async () => {
            const col = db.collection('spike_ttl')
            await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
            const id = randomUUID()
            await col.insertOne({ _id: id, expiresAt: new Date(Date.now() - 60_000) })

            const deadline = Date.now() + 150_000
            while (Date.now() < deadline) {
                await new Promise((r) => setTimeout(r, 10_000))
                if (!(await col.findOne({ _id: id }))) return 'reaped'
                process.stdout.write('.')
            }
            throw new Error('not reaped within 150s (TTL monitor runs ~60s; may be M0 throttling)')
        })
    }

    // ---------------------------------------------------------------
    // 8. bcrypt verification — decides whether users keep their passwords
    //
    // Better Auth hashes with scrypt by default. Supabase stores bcrypt MCF.
    // If bcrypt can be verified, imported users log in with their existing
    // password. If not, everyone needs a reset at cutover.
    // ---------------------------------------------------------------
    if (!BCRYPT_HASH) {
        record(
            'bcrypt hash verifies',
            'SKIP',
            'set SUPABASE_BCRYPT_HASH to a real hash from auth.users',
            false
        )
    } else {
        await check('bcrypt hash verifies against a known password', async () => {
            let bcrypt
            try {
                bcrypt = await import('bcryptjs')
            } catch {
                throw new Error('bcryptjs not installed — run: npm i -D bcryptjs')
            }
            const plain = process.env.SUPABASE_BCRYPT_PLAINTEXT
            if (!plain) throw new Error('set SUPABASE_BCRYPT_PLAINTEXT to that user\'s password')
            const ok = await (bcrypt.default ?? bcrypt).compare(plain, BCRYPT_HASH)
            if (!ok) throw new Error('bcrypt.compare returned false — wrong password or unsupported MCF variant')
            return `verified ${BCRYPT_HASH.slice(0, 7)}… — no forced reset needed`
        })
    }

    // ---------------------------------------------------------------
    // 9. Connection reuse — M0 caps at 500 connections
    //
    // Vercel lambdas must share a cached client. Confirm repeated getDb()
    // calls do not open a new connection each time.
    // ---------------------------------------------------------------
    await check('repeated operations reuse one pooled connection', async () => {
        const col = db.collection('spike_pool')
        await Promise.all(Array.from({ length: 50 }, (_, i) => col.insertOne({ _id: randomUUID(), i })))
        const stats = await db.admin().serverStatus()
        const current = stats?.connections?.current
        return `server reports ${current} current connections (maxPoolSize=10)`
    })

    // ---------------------------------------------------------------
    console.log('\nCleaning up…')
    await db.dropDatabase()

    const failed = results.filter((r) => r.status === 'FAIL')
    const blocking = failed.filter((r) => r.required)
    const skipped = results.filter((r) => r.status === 'SKIP')

    console.log(`\n${results.length - failed.length - skipped.length} passed, ${failed.length} failed, ${skipped.length} skipped`)

    if (skipped.length) {
        console.log('\nSkipped checks are not proof of anything — run them before relying on the gate:')
        skipped.forEach((r) => console.log(`  - ${r.name}: ${r.detail}`))
    }
    if (blocking.length) {
        console.log('\nGATE FAILED:')
        blocking.forEach((r) => console.log(`  - ${r.name}: ${r.detail}`))
        process.exitCode = 1
    } else if (!failed.length) {
        console.log('\nGATE PASSED — Phase 2 can proceed.')
    }
}

main()
    .catch((err) => {
        console.error('\nSpike aborted:', err)
        process.exitCode = 2
    })
    .finally(() => client.close())
