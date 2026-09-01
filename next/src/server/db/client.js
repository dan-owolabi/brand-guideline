import 'server-only'
import { MongoClient } from 'mongodb'

/**
 * The MongoDB connection. PRIVATE TO src/server/db/.
 *
 * Nothing outside src/server/db/ may import this module — that rule is the
 * structural replacement for the Postgres RLS we are giving up. RLS denied by
 * default; imperative checks leak by default. The mitigation is to make an
 * unscoped query *unreachable* rather than merely discouraged:
 *
 *   route handler  ->  guard (produces ctx)  ->  repo (folds ctx into filter)
 *                                                  |
 *                                                  +-> getDb()   <- only here
 *
 * Enforced by the `no-restricted-imports` rule in eslint.config.mjs. If you
 * find yourself wanting to import this from a route handler, add a repo
 * function instead.
 *
 * `server-only` makes the build fail loudly if this is ever pulled into a
 * client bundle, which would leak MONGODB_URI. That matters more than usual
 * here: Atlas free tier has no static-IP allowlist for Vercel, so the
 * connection string is the entire security boundary on the network side.
 */

const options = {
    // M0 caps at 500 connections. Serverless invocations each hold a pool, so
    // keep it small and let the cached client do the reuse.
    maxPoolSize: 10,
    minPoolSize: 0,
    // Fail fast rather than hanging a request for 30s on a cold/blocked cluster.
    serverSelectionTimeoutMS: 8000,
    retryWrites: true,
}

/**
 * Connect LAZILY, on first use.
 *
 * Doing this at module load breaks `next build`: the build imports every route
 * module to collect metadata, and route modules import repos, which import
 * this. With eager init the build fails on any machine without MONGODB_URI —
 * including CI — even though nothing is actually querying.
 *
 * In development Next clears the module registry on each HMR pass, which would
 * open a fresh pool on every edit and exhaust the cluster's connection budget.
 * Caching on globalThis keeps one client across reloads. In production the
 * module cache would suffice, but the global is harmless and keeps one path.
 */
function connect() {
    const uri = process.env.MONGODB_URI
    const dbName = process.env.MONGODB_DB

    if (!uri) throw new Error('MONGODB_URI is not set')
    if (!dbName) throw new Error('MONGODB_DB is not set')

    if (!globalThis.__mongoClientPromise) {
        globalThis.__mongoClientPromise = new MongoClient(uri, options).connect()
    }
    return { clientPromise: globalThis.__mongoClientPromise, dbName }
}

/** Resolved database handle. Repos only. */
export async function getDb() {
    const { clientPromise, dbName } = connect()
    const client = await clientPromise
    return client.db(dbName)
}

/** Raw client — needed only for startSession()/transactions. Repos only. */
export async function getClient() {
    return connect().clientPromise
}

/**
 * Run a function inside a multi-document transaction.
 *
 * M0 is a real replica set so transactions are available. Used by
 * acceptInvite, which must mark the invite and push the membership atomically
 * — the Postgres `accept_invite` SECURITY DEFINER function did this for free.
 */
export async function withTransaction(fn) {
    const client = await getClient()
    const session = client.startSession()
    try {
        let result
        await session.withTransaction(async () => {
            result = await fn(session)
        })
        return result
    } finally {
        await session.endSession()
    }
}
