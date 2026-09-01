/**
 * Referential integrity check.
 *
 *   node scripts/reconcile.js            report only
 *   node scripts/reconcile.js --fix      repair what is safely repairable
 *
 * WHY THIS EXISTS
 * Postgres enforced these relationships with foreign keys. Mongo does not, and
 * that trade was made deliberately when moving off Supabase — this script is
 * the other half of that trade. Without something that actually looks, a
 * dangling reference is invisible until a page renders wrong.
 *
 * Run it nightly (GitHub Actions cron, or Vercel cron hitting a route). Exits
 * non-zero when anything is broken, so a scheduler surfaces it without anyone
 * having to read the output.
 *
 * WHAT IT WILL AND WILL NOT FIX
 * --fix only performs repairs that cannot lose information:
 *   - re-derives assets/collections accountId from the owning brand
 *   - clears collectionId/parentId pointers whose target is gone
 *   - drops memberships referencing users that no longer exist
 * It never deletes a brand, asset, collection or account. An orphaned asset
 * still holds a real file in R2, and deciding what to do with that is a
 * judgement call, not a script's.
 */

import { MongoClient, UUID } from 'mongodb'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
    readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
        .split('\n')
        .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
        .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const FIX = process.argv.includes('--fix')
const client = new MongoClient(env.MONGODB_URI)
await client.connect()
const db = client.db(env.MONGODB_DB || 'brandguide')

const [users, accounts, brands, collections, assets] = await Promise.all([
    db.collection('user').find({}, { projection: { _id: 1 } }).toArray(),
    db.collection('accounts').find({}).toArray(),
    db.collection('brands').find({}, { projection: { _id: 1, accountId: 1 } }).toArray(),
    db.collection('collections').find({}).toArray(),
    db.collection('assets').find({}).toArray(),
])

// Better Auth stores _id as a BSON UUID; our documents reference users as
// strings. Comparing the two forms directly always fails, which would make
// every membership look orphaned.
const userIds = new Set(users.map((u) => (u._id instanceof UUID ? u._id.toString() : String(u._id))))
const accountIds = new Set(accounts.map((a) => a._id))
const brandById = new Map(brands.map((b) => [b._id, b]))
const collectionIds = new Set(collections.map((c) => c._id))
const assetIds = new Set(assets.map((a) => a._id))

const problems = []
const report = (kind, items, detail) => {
    if (items.length) problems.push({ kind, count: items.length, items, detail })
    const label = kind.padEnd(38)
    console.log(`  ${label} ${items.length ? `⚠ ${items.length}` : '✓ 0'}`)
}

console.log('\n  integrity')
console.log('  ' + '─'.repeat(46))

const badMembers = accounts.flatMap((a) =>
    (a.members || []).filter((m) => !userIds.has(m.userId)).map((m) => ({ accountId: a._id, userId: m.userId }))
)
report('members -> missing user', badMembers)

const badBrands = brands.filter((b) => !accountIds.has(b.accountId))
report('brands -> missing account', badBrands)

const badAssetBrand = assets.filter((a) => !brandById.has(a.brandId))
report('assets -> missing brand', badAssetBrand)

const badColBrand = collections.filter((c) => !brandById.has(c.brandId))
report('collections -> missing brand', badColBrand)

// Denormalized accountId drifting out of sync with the owning brand is the
// failure mode that matters most: every authorization check reads it, so a
// wrong value is a permissions bug, not just untidy data.
const driftedAssets = assets.filter((a) => {
    const b = brandById.get(a.brandId)
    return b && a.accountId !== b.accountId
})
report('assets.accountId != brand.accountId', driftedAssets)

const driftedCols = collections.filter((c) => {
    const b = brandById.get(c.brandId)
    return b && c.accountId !== b.accountId
})
report('collections.accountId != brand', driftedCols)

const badCollectionRef = assets.filter((a) => a.collectionId && !collectionIds.has(a.collectionId))
report('assets -> missing collection', badCollectionRef)

const badParentRef = assets.filter((a) => a.parentId && !assetIds.has(a.parentId))
report('assets -> missing parent folder', badParentRef)

const accountsNoOwner = accounts.filter((a) => !(a.members || []).some((m) => m.role === 'owner'))
report('accounts with no owner', accountsNoOwner)

/* ── repairs ─────────────────────────────────────────────────────────── */

if (FIX && problems.length) {
    console.log('\n  repairs')
    console.log('  ' + '─'.repeat(46))
    let n = 0

    for (const a of driftedAssets) {
        await db.collection('assets').updateOne(
            { _id: a._id }, { $set: { accountId: brandById.get(a.brandId).accountId } })
        n++
    }
    for (const c of driftedCols) {
        await db.collection('collections').updateOne(
            { _id: c._id }, { $set: { accountId: brandById.get(c.brandId).accountId } })
        n++
    }
    if (driftedAssets.length || driftedCols.length) {
        console.log(`  re-derived accountId on ${driftedAssets.length + driftedCols.length} documents`)
    }

    for (const a of badCollectionRef) {
        await db.collection('assets').updateOne({ _id: a._id }, { $set: { collectionId: null } })
    }
    if (badCollectionRef.length) console.log(`  cleared ${badCollectionRef.length} dangling collectionId`)

    for (const a of badParentRef) {
        await db.collection('assets').updateOne({ _id: a._id }, { $set: { parentId: null } })
    }
    if (badParentRef.length) console.log(`  cleared ${badParentRef.length} dangling parentId`)

    for (const m of badMembers) {
        await db.collection('accounts').updateOne(
            { _id: m.accountId }, { $pull: { members: { userId: m.userId } } })
    }
    if (badMembers.length) console.log(`  removed ${badMembers.length} memberships for deleted users`)

    // Deliberately NOT repaired — each needs a human decision:
    if (badBrands.length) console.log(`  ! ${badBrands.length} brands have no account — not touched`)
    if (badAssetBrand.length) console.log(`  ! ${badAssetBrand.length} assets have no brand — not touched (files still in R2)`)
    if (badColBrand.length) console.log(`  ! ${badColBrand.length} collections have no brand — not touched`)
    if (accountsNoOwner.length) console.log(`  ! ${accountsNoOwner.length} accounts have no owner — not touched`)
}

await client.close()

if (!problems.length) {
    console.log('\n  all clean\n')
    process.exit(0)
}

console.log(`\n  ${problems.reduce((s, p) => s + p.count, 0)} issue(s) across ${problems.length} check(s)`)
if (!FIX) console.log('  rerun with --fix to repair what is safely repairable\n')
process.exit(1)
