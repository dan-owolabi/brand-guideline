import 'server-only'
import { randomUUID } from 'node:crypto'
import { getDb } from '../client.js'
import { COLLECTIONS } from '../schema.js'

/**
 * Asset repository.
 *
 * `accountId` is denormalized onto every asset so authorization is a single
 * indexed predicate and never needs a $lookup back through brands. The
 * denormalization is the reason the nightly reconciliation job exists: nothing
 * at the database level keeps asset.accountId in step with its brand's, so it
 * has to be asserted out of band.
 *
 * Note `fileKey` alongside `fileUrl`. R2 keys are tenant-prefixed
 * (acct/{accountId}/brand/{brandId}/{uuid}.{ext}) and cannot be recovered by
 * splitting the URL the way the Supabase version did.
 */

async function col() {
    return (await getDb()).collection(COLLECTIONS.assets)
}

export async function listByBrand(ctx, brandId) {
    return (await col())
        .find({ brandId, accountId: ctx.accountId })
        .sort({ createdAt: -1 })
        .toArray()
}

export async function getById(ctx, assetId) {
    return (await col()).findOne({ _id: assetId, accountId: ctx.accountId })
}

export async function create(ctx, input) {
    const doc = {
        _id: assetId(input),
        accountId: ctx.accountId,
        brandId: input.brandId,
        collectionId: input.collectionId ?? null,
        parentId: input.parentId ?? null,
        name: input.name,
        fileKey: input.fileKey ?? null,
        fileUrl: input.fileUrl ?? null,
        thumbnailUrl: input.thumbnailUrl ?? null,
        fileType: input.fileType ?? null,
        fileSize: input.fileSize ?? null,
        category: input.category ?? 'other',
        isFolder: Boolean(input.isFolder),
        createdAt: new Date(),
    }
    await (await col()).insertOne(doc)
    return doc
}

/** Bulk insert (paste / multi-upload). All forced into the caller's account. */
export async function createMany(ctx, inputs) {
    if (!inputs.length) return []
    const now = new Date()
    const docs = inputs.map((input) => ({
        _id: assetId(input),
        accountId: ctx.accountId,
        brandId: input.brandId,
        collectionId: input.collectionId ?? null,
        parentId: input.parentId ?? null,
        name: input.name,
        fileKey: input.fileKey ?? null,
        fileUrl: input.fileUrl ?? null,
        thumbnailUrl: input.thumbnailUrl ?? null,
        fileType: input.fileType ?? null,
        fileSize: input.fileSize ?? null,
        category: input.category ?? 'other',
        isFolder: Boolean(input.isFolder),
        createdAt: now,
    }))
    await (await col()).insertMany(docs)
    return docs
}

export async function rename(ctx, assetId, name) {
    return (await col()).findOneAndUpdate(
        { _id: assetId, accountId: ctx.accountId },
        { $set: { name } },
        { returnDocument: 'after' }
    )
}

/** Move assets between collections/folders. Scoped by accountId, not just id. */
export async function move(ctx, assetIds, { collectionId, parentId }) {
    const $set = {}
    if (collectionId !== undefined) $set.collectionId = collectionId
    if (parentId !== undefined) $set.parentId = parentId
    if (!Object.keys($set).length) return 0

    const res = await (await col()).updateMany(
        { _id: { $in: assetIds }, accountId: ctx.accountId },
        { $set }
    )
    return res.modifiedCount
}

/**
 * Delete assets and return their R2 keys so the caller can clean up storage.
 *
 * Returns keys for the rows actually deleted, so a caller cannot be tricked
 * into issuing R2 deletes for another tenant's objects by passing foreign ids.
 */
export async function removeMany(ctx, assetIds) {
    const c = await col()
    const doomed = await c
        .find({ _id: { $in: assetIds }, accountId: ctx.accountId }, { projection: { fileKey: 1 } })
        .toArray()

    if (!doomed.length) return { deletedCount: 0, fileKeys: [] }

    const ids = doomed.map((d) => d._id)
    const res = await c.deleteMany({ _id: { $in: ids }, accountId: ctx.accountId })

    return {
        deletedCount: res.deletedCount,
        fileKeys: doomed.map((d) => d.fileKey).filter(Boolean),
    }
}

/** Reassign every asset in a collection — used when deleting a collection. */
export async function clearCollection(ctx, collectionId, fallbackCollectionId = null) {
    const res = await (await col()).updateMany(
        { collectionId, accountId: ctx.accountId },
        { $set: { collectionId: fallbackCollectionId } }
    )
    return res.modifiedCount
}

/**
 * Asset ids are normally server-generated, but the "duplicate a section" flow
 * builds an old -> new id map on the CLIENT so that copied folders keep their
 * parent/child relationships. Server-side ids would break that mapping, so a
 * caller may supply one.
 *
 * Safe because it is not an authorization surface: accountId is still taken
 * from ctx, never the payload, so a supplied id can only ever land inside the
 * caller's own account. A collision fails loudly with E11000 rather than
 * overwriting. The format check keeps it to well-formed UUIDs so nothing
 * exotic reaches the _id index.
 */
function assetId(input) {
    const supplied = input?._id ?? input?.id
    if (typeof supplied === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(supplied)) {
        return supplied
    }
    return randomUUID()
}
