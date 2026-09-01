import 'server-only'
import { randomUUID } from 'node:crypto'
import { getDb, withTransaction } from '../client.js'
import { COLLECTIONS } from '../schema.js'

/**
 * Invite repository.
 *
 * Replaces migration 003's `account_invites` table plus its `accept_invite`
 * SECURITY DEFINER function.
 *
 * Two Supabase bugs are fixed here by construction:
 *
 *  1. `FOR SELECT USING (true)` and `FOR UPDATE USING (true)` let anyone
 *     enumerate and mutate every invite row in the system. Here the only
 *     unauthenticated entry point is getPublicByToken(), which returns a
 *     fixed, minimal projection — never the row, never invitedBy, never the
 *     email of the invitee.
 *
 *  2. Expiry was bookkeeping (`status='expired'`) that something had to run.
 *     Now it is a TTL index on expiresAt; Mongo reaps the documents.
 */

const INVITE_TTL_DAYS = 7

async function col() {
    return (await getDb()).collection(COLLECTIONS.invites)
}

export async function listForAccount(ctx) {
    return (await col())
        .find(
            { accountId: ctx.accountId, status: 'pending' },
            { projection: { token: 0 } } // never hand the token back over the wire
        )
        .sort({ createdAt: -1 })
        .toArray()
}

/**
 * Create a pending invite. Duplicate pending invites for the same
 * (account, email) raise E11000 via the partial unique index — the caller maps
 * that the way the old code mapped Postgres 23505.
 */
export async function create(ctx, { email, role }) {
    const now = new Date()
    const doc = {
        _id: randomUUID(),
        accountId: ctx.accountId,
        email: email.trim().toLowerCase(),
        role,
        token: randomUUID(),
        status: 'pending',
        invitedBy: ctx.userId,
        createdAt: now,
        expiresAt: new Date(now.getTime() + INVITE_TTL_DAYS * 86400_000),
    }
    await (await col()).insertOne(doc)
    return doc
}

/**
 * UNAUTHENTICATED. The only public invite read.
 *
 * Returns just enough to render the accept screen. Deliberately omits the
 * invitee's email so a leaked or guessed link cannot be used to harvest
 * addresses, and omits invitedBy and the account id.
 */
export async function getPublicByToken(token) {
    if (typeof token !== 'string' || !token) return null

    const d = await getDb()
    const invite = await d
        .collection(COLLECTIONS.invites)
        .findOne(
            { token, status: 'pending', expiresAt: { $gt: new Date() } },
            { projection: { accountId: 1, role: 1, expiresAt: 1 } }
        )
    if (!invite) return null

    const account = await d
        .collection(COLLECTIONS.accounts)
        .findOne({ _id: invite.accountId }, { projection: { name: 1, logoUrl: 1 } })
    if (!account) return null

    return {
        accountName: account.name,
        accountLogoUrl: account.logoUrl ?? null,
        role: invite.role,
        expiresAt: invite.expiresAt,
    }
}

/**
 * Accept an invite: mark it accepted and add the membership atomically.
 *
 * This is the direct replacement for the `accept_invite` SECURITY DEFINER
 * function. The transaction matters — a partial apply would either consume the
 * invite without granting access, or grant access while leaving a live invite
 * token outstanding.
 *
 * The status filter inside the transaction makes it idempotent under
 * double-submit: the second attempt matches nothing and returns already=true.
 */
export async function accept(token, userId) {
    return withTransaction(async (session) => {
        const d = await getDb()
        const invites = d.collection(COLLECTIONS.invites)
        const accounts = d.collection(COLLECTIONS.accounts)

        const invite = await invites.findOne(
            { token, status: 'pending', expiresAt: { $gt: new Date() } },
            { session }
        )
        if (!invite) return { ok: false, reason: 'invalid_or_expired' }

        const claimed = await invites.updateOne(
            { _id: invite._id, status: 'pending' },
            { $set: { status: 'accepted', acceptedAt: new Date(), acceptedBy: userId } },
            { session }
        )
        if (claimed.modifiedCount !== 1) return { ok: false, reason: 'already_used' }

        // $ne guard makes re-accepting by an existing member a no-op rather
        // than creating a duplicate membership entry.
        await accounts.updateOne(
            { _id: invite.accountId, 'members.userId': { $ne: userId } },
            {
                $push: { members: { userId, role: invite.role, addedAt: new Date() } },
                $set: { updatedAt: new Date() },
            },
            { session }
        )

        return { ok: true, accountId: invite.accountId, role: invite.role }
    })
}

/** Owner-only revoke. Scoped to the caller's account. */
export async function revoke(ctx, inviteId) {
    const res = await (await col()).updateOne(
        { _id: inviteId, accountId: ctx.accountId, status: 'pending' },
        { $set: { status: 'revoked', revokedAt: new Date() } }
    )
    return res.modifiedCount === 1
}
