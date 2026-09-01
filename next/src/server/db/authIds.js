import 'server-only'
import { UUID } from 'mongodb'

/**
 * The Better Auth id boundary.
 *
 * Two different physical representations of the same uuid coexist in this
 * database, and mixing them fails SILENTLY — a query simply matches nothing.
 * That is the single most dangerous footgun in this migration, so every
 * crossing goes through here rather than being open-coded.
 *
 *   OUR collections (accounts, brands, assets, collections, invites)
 *     _id and every *Id field is a STRING uuid.
 *     Chosen because it round-trips through JSON, appears legibly in logs and
 *     Compass, and is what all 40 authorization tests assert against.
 *
 *   BETTER AUTH collections (user, session, account, verification)
 *     _id is a native BSON UUID (Binary subtype 4).
 *     Not a choice we get to make: with advanced.database.generateId = 'uuid'
 *     the Mongo adapter does `new UUID(value)` on write
 *     (@better-auth/mongo-adapter, index.mjs:97).
 *
 * The adapter converts back to a string on read (index.mjs:496), so anything
 * arriving from `auth.api.*` — including session.user.id — is already a
 * string. Conversion is therefore only needed when WE query Better Auth's
 * collections directly with the driver.
 *
 * Phase 7 note: the Supabase import writes these documents by hand, so it must
 * use toAuthId() for user._id and account.userId. Writing plain strings there
 * produces users who exist but can never log in — Better Auth looks them up by
 * BSON UUID and finds nothing, surfacing as "Invalid email or password".
 */

/** String uuid -> the BSON UUID that Better Auth's collections are keyed by. */
export function toAuthId(id) {
    if (id instanceof UUID) return id
    if (typeof id !== 'string') return null
    try {
        return new UUID(id)
    } catch {
        // Not a uuid (a legacy id, or caller-supplied junk). Return null so the
        // caller's filter matches nothing, rather than throwing mid-request.
        return null
    }
}

/** Many at once, dropping anything unconvertible. */
export function toAuthIds(ids) {
    return ids.map(toAuthId).filter(Boolean)
}

/** BSON UUID (or anything) -> the string form our collections store. */
export function fromAuthId(id) {
    if (id == null) return null
    return typeof id === 'string' ? id : id.toString()
}
