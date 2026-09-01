import 'server-only'
import { randomUUID } from 'node:crypto'
import { getDb } from '../client.js'
import { COLLECTIONS } from '../schema.js'

/**
 * Collection (asset section) repository.
 *
 * `order` is an ordinary field here. On Postgres it was a quoted reserved word
 * that every query had to spell as `"order"` — that hazard is gone.
 */

async function col() {
    return (await getDb()).collection(COLLECTIONS.collections)
}

export async function listByBrand(ctx, brandId) {
    return (await col())
        .find({ brandId, accountId: ctx.accountId })
        .sort({ order: 1 })
        .toArray()
}

export async function create(ctx, { brandId, name, order }) {
    const doc = {
        _id: randomUUID(),
        accountId: ctx.accountId,
        brandId,
        name,
        order: order ?? 0,
        createdAt: new Date(),
    }
    await (await col()).insertOne(doc)
    return doc
}

export async function rename(ctx, collectionId, name) {
    return (await col()).findOneAndUpdate(
        { _id: collectionId, accountId: ctx.accountId },
        { $set: { name } },
        { returnDocument: 'after' }
    )
}

/**
 * Persist a new ordering in ONE round trip.
 *
 * The Supabase version issued a separate UPDATE per row inside a loop
 * (AssetsPage.jsx:270), so reordering ten sections meant ten sequential
 * requests. bulkWrite collapses that, and scoping each filter by accountId
 * means a forged id list cannot reorder another tenant's sections.
 */
export async function reorder(ctx, orderedIds) {
    if (!orderedIds.length) return 0

    const ops = orderedIds.map((id, index) => ({
        updateOne: {
            filter: { _id: id, accountId: ctx.accountId },
            update: { $set: { order: index } },
        },
    }))

    const res = await (await col()).bulkWrite(ops, { ordered: false })
    return res.modifiedCount
}

export async function remove(ctx, collectionId) {
    const res = await (await col()).deleteOne({
        _id: collectionId,
        accountId: ctx.accountId,
    })
    return res.deletedCount === 1
}
