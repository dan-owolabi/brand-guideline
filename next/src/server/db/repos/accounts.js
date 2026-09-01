import 'server-only'
import { randomUUID } from 'node:crypto'
import { getDb } from '../client.js'
import { COLLECTIONS } from '../schema.js'
import { toAuthIds, fromAuthId } from '../authIds.js'

/**
 * Account repository, including membership.
 *
 * `account_members` is embedded as `accounts.members[]` rather than a separate
 * collection. Teams are small and bounded, so one indexed lookup returns the
 * account and the caller's role together. This also structurally eliminates
 * the RLS-recursion class of bug that Postgres migrations 004 and
 * fix_rls_recursion.sql both existed to patch: there is no self-referencing
 * policy because there is no second table.
 */

const EDITABLE = ['name', 'logoUrl', 'customDomain', 'isPublished', 'billingEmail']

async function col() {
    return (await getDb()).collection(COLLECTIONS.accounts)
}

/**
 * Accounts the user belongs to, with their own role attached.
 *
 * Replaces the PostgREST embedded select
 *   .from('account_members').select('role, account:accounts(...)')
 * with a single query and no join. Projects `members.$` so a viewer never
 * receives the full member roster just by listing their accounts.
 */
export async function listForUser(userId) {
    const docs = await (await col())
        .find(
            { 'members.userId': userId },
            {
                projection: {
                    name: 1, slug: 1, logoUrl: 1, isPublished: 1,
                    customDomain: 1, plan: 1, 'members.$': 1,
                },
            }
        )
        .toArray()

    return docs.map(({ members, ...account }) => ({
        ...account,
        role: members?.[0]?.role ?? null,
    }))
}

/** Full account document, scoped to the caller's own account. */
export async function get(ctx) {
    return (await col()).findOne({ _id: ctx.accountId })
}

/**
 * Create an account and install the creator as owner in one insert.
 *
 * On Postgres this needed migration 006's special bootstrap policy to escape a
 * chicken-and-egg problem: you could not insert the first membership because
 * the policy required you to already be a member. Embedding the array removes
 * the problem entirely — the owner exists the moment the document does.
 */
export async function createWithOwner(userId, input) {
    const now = new Date()
    const doc = {
        _id: randomUUID(),
        name: input.name,
        slug: input.slug,
        logoUrl: input.logoUrl ?? null,
        customDomain: null,
        isPublished: false,
        plan: 'free',
        billingEmail: input.billingEmail ?? null,
        members: [{ userId, role: 'owner', addedAt: now }],
        createdAt: now,
        updatedAt: now,
    }
    await (await col()).insertOne(doc)
    return doc
}

export async function update(ctx, patch) {
    const $set = { updatedAt: new Date() }
    for (const k of EDITABLE) {
        if (patch[k] !== undefined) $set[k] = patch[k]
    }
    return (await col()).findOneAndUpdate(
        { _id: ctx.accountId },
        { $set },
        { returnDocument: 'after' }
    )
}

/** Raw member list (userId + role only). Route must require owner. */
export async function listMembers(ctx) {
    const doc = await (await col()).findOne(
        { _id: ctx.accountId },
        { projection: { members: 1 } }
    )
    return doc?.members ?? []
}

/**
 * Member list enriched with each user's name, email and avatar.
 *
 * Membership stores only userId, so display data comes from Better Auth's
 * `user` collection — the one place a repo reaches across that boundary.
 *
 * Done as two indexed queries rather than a $lookup, because the two sides key
 * on different physical types: our members[].userId is a STRING uuid, theirs
 * is a BSON UUID (see authIds.js). A $lookup on those fields matches nothing,
 * silently — which is exactly the bug this replaced. Making it work in-pipeline
 * would need a computed `$toString: '$_id'` comparison, which cannot use the
 * _id index; an $in over converted ids can.
 */
export async function listMembersWithUsers(ctx) {
    const members = await listMembers(ctx)
    if (!members.length) return []

    const db = await getDb()
    const users = await db
        .collection(COLLECTIONS.authUser)
        .find(
            { _id: { $in: toAuthIds(members.map((m) => m.userId)) } },
            // Explicit projection: Better Auth's user document carries fields
            // that have no business reaching a settings screen.
            { projection: { name: 1, email: 1, image: 1, fullName: 1, avatarUrl: 1 } }
        )
        .toArray()

    const byId = new Map(users.map((u) => [fromAuthId(u._id), u]))

    return members.map((m) => {
        const u = byId.get(m.userId)
        return {
            userId: m.userId,
            role: m.role,
            addedAt: m.addedAt ?? null,
            // Undefined when the membership outlived the user record. Left
            // visible rather than filtered so the nightly reconciliation job
            // has something to find.
            email: u?.email ?? null,
            name: u?.fullName ?? u?.name ?? null,
            avatarUrl: u?.avatarUrl ?? u?.image ?? null,
        }
    })
}

/** True if someone with this email is already a member. Used before inviting. */
export async function hasMemberWithEmail(ctx, email) {
    const members = await listMembersWithUsers(ctx)
    const needle = email.trim().toLowerCase()
    return members.some((m) => m.email && m.email.toLowerCase() === needle)
}

export async function addMember(ctx, userId, role, session) {
    return (await col()).updateOne(
        { _id: ctx.accountId, 'members.userId': { $ne: userId } },
        { $push: { members: { userId, role, addedAt: new Date() } }, $set: { updatedAt: new Date() } },
        session ? { session } : {}
    )
}

export async function setMemberRole(ctx, userId, role) {
    return (await col()).updateOne(
        { _id: ctx.accountId, 'members.userId': userId },
        { $set: { 'members.$.role': role, updatedAt: new Date() } }
    )
}

/**
 * Remove a member, refusing to remove the last owner.
 *
 * The guard is in the filter rather than a read-then-write, so two concurrent
 * removals cannot both observe two owners and both succeed.
 */
export async function removeMember(ctx, userId) {
    const isTargetOwner = await (await col()).findOne(
        { _id: ctx.accountId, members: { $elemMatch: { userId, role: 'owner' } } },
        { projection: { _id: 1 } }
    )

    const filter = { _id: ctx.accountId }
    if (isTargetOwner) {
        // Require at least two owners to still exist at write time.
        filter['members.1'] = { $exists: true }
        filter.$expr = {
            $gt: [
                { $size: { $filter: {
                    input: '$members', as: 'm', cond: { $eq: ['$$m.role', 'owner'] },
                } } },
                1,
            ],
        }
    }

    const res = await (await col()).updateOne(filter, {
        $pull: { members: { userId } },
        $set: { updatedAt: new Date() },
    })

    if (res.matchedCount === 0 && isTargetOwner) {
        const err = new Error('Cannot remove the last owner')
        err.status = 409
        throw err
    }
    return res.modifiedCount === 1
}

/** True if the slug is free. Race-safe uniqueness is the unique index. */
export async function slugAvailable(slug) {
    const existing = await (await col()).findOne({ slug }, { projection: { _id: 1 } })
    return !existing
}
