/**
 * Phase 7 — Supabase → MongoDB data migration.
 *
 *   node scripts/migrate_from_supabase.js --dry-run     inspect, write nothing
 *   node scripts/migrate_from_supabase.js               migrate data only
 *   node scripts/migrate_from_supabase.js --with-files  also copy files to R2
 *
 * DESIGN NOTES
 *
 * Idempotent by construction. Every write is an upsert keyed by the original
 * Supabase id, so this is safe to run repeatedly — which it will be: once as a
 * rehearsal, then again at cutover to pick up the delta. Nothing here generates
 * a new id for an existing row.
 *
 * Ids are preserved, never regenerated. accounts.members[].userId,
 * brands.accountId, assets.brandId and invites.invitedBy are all references to
 * Supabase uuids; minting fresh ones would silently orphan every relationship.
 *
 * Better Auth's collections are written with BSON UUID _ids via toAuthId(),
 * while our own collections use string uuids. That asymmetry is not a choice —
 * see src/server/db/authIds.js. Getting it wrong produces users who exist but
 * can never log in.
 *
 * Order matters: users → accounts → brands → collections → assets → invites.
 * Each step depends on ids written by the previous one.
 */

import { MongoClient, UUID } from 'mongodb'
import { readFileSync } from 'node:fs'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID, createHash } from 'node:crypto'

/* ── env ─────────────────────────────────────────────────────────────── */

const env = Object.fromEntries(
    readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
        .split('\n')
        .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
        .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const SUPABASE_URL = env.SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const MONGODB_URI = env.MONGODB_URI
const MONGODB_DB = env.MONGODB_DB || 'brandguide'

const DRY = process.argv.includes('--dry-run')
const WITH_FILES = process.argv.includes('--with-files')

for (const [k, v] of Object.entries({ SUPABASE_URL, SERVICE_KEY, MONGODB_URI })) {
    if (!v) { console.error(`Missing ${k} in .env.local`); process.exit(1) }
}

/* ── supabase reads (service_role bypasses RLS) ──────────────────────── */

async function sb(path) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    })
    if (!res.ok) throw new Error(`GET ${path} -> ${res.status} ${await res.text()}`)
    return res.json()
}

async function sbRpc(fn) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
        },
        body: '{}',
    })
    if (!res.ok) throw new Error(`RPC ${fn} -> ${res.status} ${await res.text()}`)
    return res.json()
}

/* ── helpers ─────────────────────────────────────────────────────────── */

const date = (v) => (v ? new Date(v) : new Date())
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined))

const stats = {}
function tally(name, n) { stats[name] = (stats[name] || 0) + n }

/** Bulk upsert keyed by _id. replaceOne+upsert, not insert, so reruns converge. */
async function upsertAll(col, docs, { key = '_id' } = {}) {
    if (!docs.length) return 0
    if (DRY) return docs.length
    const ops = docs.map((d) => ({
        replaceOne: { filter: { [key]: d[key] }, replacement: d, upsert: true },
    }))
    const r = await col.bulkWrite(ops, { ordered: false })
    // NOT upserted + modified + matched: an updated document is counted by
    // both matchedCount and modifiedCount, so summing all three double-counts
    // every rerun and reports twice the real number. Rows touched is
    // upserted + matched.
    return r.upsertedCount + r.matchedCount
}

/* ── main ────────────────────────────────────────────────────────────── */

const client = new MongoClient(MONGODB_URI)
await client.connect()
const db = client.db(MONGODB_DB)

console.log(`\n${DRY ? 'DRY RUN — nothing will be written' : 'MIGRATING'} → ${MONGODB_DB}\n`)

/* 1. USERS — Better Auth collections, BSON UUID ids ------------------- */

const authUsers = await sbRpc('export_auth_users')
const userDocs = []
const credentialDocs = []

for (const u of authUsers) {
    const meta = u.raw_user_meta_data || {}
    const fullName = meta.full_name || meta.name || (u.email || '').split('@')[0]

    userDocs.push(clean({
        _id: new UUID(u.id),
        id: u.id,
        name: fullName,
        email: u.email,
        // Every exported row is confirmed — 014 filters on email_confirmed_at.
        // Marking false would force a re-verification email none of them expect.
        emailVerified: true,
        image: meta.avatar_url || null,
        fullName,
        avatarUrl: meta.avatar_url || null,
        createdAt: date(u.created_at),
        updatedAt: date(u.updated_at),
    }))

    // Only users with a bcrypt hash get a credential row. The Google-only
    // users deliberately get none: Better Auth creates their `google` account
    // row on first sign-in and links it by verified email (accountLinking is
    // enabled with google trusted). Writing an empty credential here would
    // instead let them attempt a password login that can never succeed.
    if (u.encrypted_password && u.encrypted_password.startsWith('$2')) {
        credentialDocs.push({
            _id: new UUID(randomUUID()),
            userId: new UUID(u.id),
            accountId: u.id,
            providerId: 'credential',
            password: u.encrypted_password,
            createdAt: date(u.created_at),
            updatedAt: date(u.updated_at),
        })
    }
}

tally('users', await upsertAll(db.collection('user'), userDocs))
/**
 * Credentials are matched on (userId, providerId), not _id — there is no
 * stable Supabase id for a credential row to reuse.
 *
 * That makes replaceOne wrong here: the replacement would carry a freshly
 * generated _id, and Mongo rejects any attempt to alter an existing _id
 * ("performing an update on the path '_id' would modify the immutable field").
 * The first run inserts fine and every rerun then fails — which defeats the
 * whole point of a script that gets run twice, once as a rehearsal and once
 * for the cutover delta.
 *
 * $set the mutable fields, $setOnInsert the _id, so the id is chosen once and
 * never touched again.
 */
if (!DRY && credentialDocs.length) {
    await db.collection('account').bulkWrite(
        credentialDocs.map(({ _id, userId, providerId, ...rest }) => ({
            updateOne: {
                filter: { userId, providerId },
                update: {
                    $set: rest,
                    $setOnInsert: { _id, userId, providerId },
                },
                upsert: true,
            },
        })),
        { ordered: false }
    )
}
tally('credentials', credentialDocs.length)

/* 2. ACCOUNTS + members (embedded) ------------------------------------ */

const [sbAccounts, sbMembers] = await Promise.all([
    sb('accounts?select=*'),
    sb('account_members?select=*'),
])

const membersByAccount = new Map()
for (const m of sbMembers) {
    if (!membersByAccount.has(m.account_id)) membersByAccount.set(m.account_id, [])
    membersByAccount.get(m.account_id).push({
        userId: m.user_id,
        role: m.role,
        addedAt: date(m.created_at),
    })
}

const accountDocs = sbAccounts.map((a) => clean({
    _id: a.id,
    name: a.name,
    slug: a.slug,
    // The unique index on customDomain is partial on {$type:'string'}, so
    // absent is correct here — an empty string would collide across accounts.
    customDomain: a.custom_domain || undefined,
    isPublished: Boolean(a.is_published),
    plan: a.plan || 'free',
    logoUrl: a.logo_url || null,
    billingEmail: a.billing_email || null,
    members: membersByAccount.get(a.id) || [],
    createdAt: date(a.created_at),
    updatedAt: date(a.updated_at),
}))

tally('accounts', await upsertAll(db.collection('accounts'), accountDocs))
tally('memberships', sbMembers.length)

/* 3. BRANDS ----------------------------------------------------------- */

const sbBrands = await sb('brands?select=*')
const brandDocs = sbBrands.map((b) => clean({
    _id: b.id,
    accountId: b.account_id,
    name: b.name,
    // Partial unique index on {slug:{$type:'string'}} — a slug-less brand must
    // omit the field rather than store null, or the second one collides.
    slug: b.slug || undefined,
    logoUrl: b.logo_url || null,
    bannerUrl: b.banner_url || null,
    primaryColor: b.primary_color || null,
    customFontUrl: b.custom_font_url || null,
    draft: b.draft || null,
    published: b.published || null,
    createdAt: date(b.created_at),
    updatedAt: date(b.updated_at),
}))
tally('brands', await upsertAll(db.collection('brands'), brandDocs))

const accountOfBrand = new Map(sbBrands.map((b) => [b.id, b.account_id]))

/* 4. COLLECTIONS ------------------------------------------------------ */

const sbCollections = await sb('collections?select=*')
const collectionDocs = sbCollections.map((c) => clean({
    _id: c.id,
    brandId: c.brand_id,
    // Denormalized so authorization is one indexed predicate, never a $lookup.
    accountId: accountOfBrand.get(c.brand_id) || null,
    name: c.name,
    order: c.order ?? 0,
    createdAt: date(c.created_at),
}))
tally('collections', await upsertAll(db.collection('collections'), collectionDocs))

/* 5. ASSETS ----------------------------------------------------------- */

const sbAssets = await sb('assets?select=*')
const assetDocs = sbAssets.map((a) => clean({
    _id: a.id,
    brandId: a.brand_id,
    accountId: accountOfBrand.get(a.brand_id) || null,
    collectionId: a.collection_id || null,
    parentId: a.parent_id || null,
    name: a.name,
    // fileKey is populated by the --with-files pass; until then the original
    // Supabase URL keeps working, which is what makes the file copy an
    // independent, resumable step rather than part of the cutover.
    fileKey: null,
    fileUrl: a.file_url || null,
    thumbnailUrl: a.thumbnail_url || null,
    fileType: a.file_type || null,
    fileSize: a.file_size ?? null,
    category: a.category || 'other',
    isFolder: Boolean(a.is_folder),
    createdAt: date(a.created_at),
}))
tally('assets', await upsertAll(db.collection('assets'), assetDocs))

/* 6. INVITES ---------------------------------------------------------- */

const sbInvites = await sb('account_invites?select=*')
const now = Date.now()
const inviteDocs = sbInvites
    // The TTL index deletes anything already expired the moment it is written,
    // so importing dead invites just creates churn.
    .filter((i) => i.status === 'pending' && new Date(i.expires_at).getTime() > now)
    .map((i) => clean({
        _id: i.id,
        accountId: i.account_id,
        email: i.email,
        role: i.role,
        token: i.token,
        status: i.status,
        invitedBy: i.invited_by || null,
        expiresAt: date(i.expires_at),
        createdAt: date(i.created_at),
    }))
tally('invites', await upsertAll(db.collection('invites'), inviteDocs))
tally('invites_skipped_expired', sbInvites.length - inviteDocs.length)

/* ── report ──────────────────────────────────────────────────────────── */

console.log('  collection            migrated')
console.log('  ─────────────────────────────')
for (const [k, v] of Object.entries(stats)) {
    console.log(`  ${k.padEnd(22)}${String(v).padStart(6)}`)
}

/* ── integrity checks ────────────────────────────────────────────────── */

console.log('\n  integrity')
console.log('  ─────────────────────────────')

const userIds = new Set(authUsers.map((u) => u.id))
const accountIds = new Set(sbAccounts.map((a) => a.id))
const brandIds = new Set(sbBrands.map((b) => b.id))

const orphanMembers = sbMembers.filter((m) => !userIds.has(m.user_id))
const orphanBrands = sbBrands.filter((b) => !accountIds.has(b.account_id))
const orphanAssets = sbAssets.filter((a) => !brandIds.has(a.brand_id))
const orphanCollections = sbCollections.filter((c) => !brandIds.has(c.brand_id))

const line = (label, bad, total) =>
    console.log(`  ${label.padEnd(30)} ${bad.length ? `⚠ ${bad.length}/${total}` : `✓ 0/${total}`}`)

line('members -> missing user', orphanMembers, sbMembers.length)
line('brands -> missing account', orphanBrands, sbBrands.length)
line('assets -> missing brand', orphanAssets, sbAssets.length)
line('collections -> missing brand', orphanCollections, sbCollections.length)

if (orphanMembers.length) {
    // Worth naming: these are memberships pointing at users that 014 filtered
    // out (unconfirmed signups). They will never resolve to a login.
    console.log('    orphaned memberships reference user ids:',
        [...new Set(orphanMembers.map((m) => m.user_id))].join(', '))
}

/* ── file copy to R2 (optional pass) ─────────────────────────────────── */

if (WITH_FILES) {
    console.log('\n  copying files to R2')
    console.log('  ─────────────────────────────')

    const s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: env.R2_ACCESS_KEY_ID,
            secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
    })
    const BUCKET = env.R2_BUCKET
    const PUBLIC_BASE = env.NEXT_PUBLIC_R2_PUBLIC_BASE.replace(/\/$/, '')

    /**
     * Supabase keys are flat with no tenant information, so the mapping has to
     * be inverted: walk everything that REFERENCES a file, and take tenancy
     * from the referring document. Anything not referenced is an orphan and is
     * deliberately left behind.
     */
    const urlMap = new Map() // old url -> { accountId, brandId }

    const note = (url, accountId, brandId) => {
        if (typeof url === 'string' && url.includes('/storage/v1/object/public/')) {
            if (!urlMap.has(url)) urlMap.set(url, { accountId, brandId })
        }
    }

    const walk = (node, accountId, brandId) => {
        if (!node) return
        if (typeof node === 'string') return note(node, accountId, brandId)
        if (Array.isArray(node)) return node.forEach((n) => walk(n, accountId, brandId))
        if (typeof node === 'object') {
            for (const v of Object.values(node)) walk(v, accountId, brandId)
        }
    }

    for (const a of sbAccounts) note(a.logo_url, a.id, null)
    for (const b of sbBrands) {
        note(b.logo_url, b.account_id, b.id)
        note(b.banner_url, b.account_id, b.id)
        note(b.custom_font_url, b.account_id, b.id)
        walk(b.draft, b.account_id, b.id)
        walk(b.published, b.account_id, b.id)
    }
    for (const a of sbAssets) {
        const acc = accountOfBrand.get(a.brand_id)
        note(a.file_url, acc, a.brand_id)
        note(a.thumbnail_url, acc, a.brand_id)
    }

    console.log(`  ${urlMap.size} distinct files referenced`)

    if (DRY) {
        console.log('  (dry run — no files copied)')
    } else {
        let copied = 0, skipped = 0, failed = 0
        const rewrites = new Map() // old url -> new url

        for (const [url, { accountId, brandId }] of urlMap) {
            const original = decodeURIComponent(url.split('/').pop().split('?')[0])
            const ext = original.includes('.') ? original.split('.').pop() : 'bin'

            /**
             * The key is DERIVED from the source URL, not random.
             *
             * With a random key, every rerun would copy all ~355 files again
             * under fresh names and leave the previous set orphaned in the
             * bucket — and this script is explicitly designed to be run twice
             * (rehearsal, then the cutover delta). Hashing the source URL makes
             * the mapping stable: the same file always lands on the same key,
             * so a rerun is a no-op instead of a duplication.
             */
            const hash = createHash('sha256').update(url).digest('hex').slice(0, 32)
            const key = `acct/${accountId || 'unknown'}/brand/${brandId || 'shared'}/${hash}.${ext}`
            const newUrl = `${PUBLIC_BASE}/${key}`

            // Already there from a previous run — record the mapping so the URL
            // rewrite still happens, but don't transfer the bytes again.
            try {
                await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
                rewrites.set(url, newUrl)
                skipped++
                continue
            } catch { /* not present, fall through and copy */ }

            /**
             * Retry transient failures. The first run lost 2 files to
             * `ERR_SSL_DECRYPTION_FAILED_OR_BAD_RECORD_MAC` — both objects were
             * still perfectly readable afterwards, so the fetch was at fault,
             * not the data. Over ~355 sequential requests a couple of TLS
             * hiccups are expected; silently dropping them is not.
             */
            let done = false
            for (let attempt = 1; attempt <= 3 && !done; attempt++) {
                try {
                    const res = await fetch(url)
                    if (!res.ok) break // a real 404 — retrying will not help
                    const buf = Buffer.from(await res.arrayBuffer())
                    await s3.send(new PutObjectCommand({
                        Bucket: BUCKET,
                        Key: key,
                        Body: buf,
                        ContentType: res.headers.get('content-type') || 'application/octet-stream',
                    }))
                    rewrites.set(url, newUrl)
                    copied++
                    done = true
                } catch (err) {
                    if (attempt === 3) {
                        failed++
                        console.log(`    ! failed after 3 attempts: ${original} (${err.code || err.name})`)
                    } else {
                        await new Promise((r) => setTimeout(r, 400 * attempt))
                    }
                }
            }
            if (!done && !failed) failed++

            if ((copied + skipped) % 50 === 0) {
                console.log(`    ${copied + skipped}/${urlMap.size}…`)
            }
        }

        console.log(`  copied ${copied}, already present ${skipped}, failed ${failed}`)

        // Rewrite the URLs everywhere they appear. Done as a second pass so a
        // failed copy never leaves a document pointing at a key that does not
        // exist — an unrewritten Supabase URL still resolves.
        const swap = (s) => (typeof s === 'string' && rewrites.has(s) ? rewrites.get(s) : s)
        const deepSwap = (node) => {
            if (typeof node === 'string') return swap(node)
            if (Array.isArray(node)) return node.map(deepSwap)
            if (node && typeof node === 'object') {
                return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, deepSwap(v)]))
            }
            return node
        }

        let docsTouched = 0
        for (const b of sbBrands) {
            const update = clean({
                logoUrl: swap(b.logo_url) ?? null,
                bannerUrl: swap(b.banner_url) ?? null,
                customFontUrl: swap(b.custom_font_url) ?? null,
                draft: b.draft ? deepSwap(b.draft) : null,
                published: b.published ? deepSwap(b.published) : null,
            })
            await db.collection('brands').updateOne({ _id: b.id }, { $set: update })
            docsTouched++
        }
        for (const a of sbAssets) {
            const newUrl = swap(a.file_url)
            if (newUrl === a.file_url) continue
            await db.collection('assets').updateOne(
                { _id: a.id },
                { $set: { fileUrl: newUrl, thumbnailUrl: swap(a.thumbnail_url), fileKey: newUrl.replace(`${PUBLIC_BASE}/`, '') } }
            )
            docsTouched++
        }
        for (const a of sbAccounts) {
            const newUrl = swap(a.logo_url)
            if (newUrl === a.logo_url) continue
            await db.collection('accounts').updateOne({ _id: a.id }, { $set: { logoUrl: newUrl } })
            docsTouched++
        }
        console.log(`  rewrote urls in ${docsTouched} documents`)
    }
} else {
    console.log('\n  files NOT copied — rerun with --with-files')
    console.log('  (existing Supabase URLs keep working until then)')
}

await client.close()
console.log(DRY ? '\nDry run complete.\n' : '\nMigration complete.\n')
