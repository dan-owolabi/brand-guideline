#!/usr/bin/env node
/**
 * Apply every index in src/server/db/schema.js. Idempotent — run on deploy.
 *
 *   cd next && node scripts/create_indexes.js
 *
 * Reads MONGODB_URI / MONGODB_DB from .env.local (or the ambient environment).
 *
 * createIndex is a no-op when an identical index already exists, but it ERRORS
 * if an index of the same name exists with different options. That is the
 * useful case to surface loudly: it means schema.js and the cluster have
 * drifted, which would otherwise show up much later as a missing uniqueness
 * guarantee or a TTL that never reaps.
 */

import { MongoClient } from 'mongodb'
import { readFileSync, existsSync } from 'node:fs'
import { INDEXES } from '../src/server/db/schema.js'

// Minimal .env.local loader so this runs without extra deps.
for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue
    for (const line of readFileSync(file, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
        if (m && !process.env[m[1]]) {
            process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
        }
    }
}

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB

if (!uri || !dbName) {
    console.error('MONGODB_URI and MONGODB_DB must be set (.env.local or environment).')
    process.exit(2)
}

const client = new MongoClient(uri, { maxPoolSize: 5 })

async function main() {
    await client.connect()
    const db = client.db(dbName)
    console.log(`Applying indexes to "${dbName}"\n`)

    let created = 0
    let existing = 0
    let failed = 0

    for (const [collection, specs] of Object.entries(INDEXES)) {
        console.log(`  ${collection}`)
        for (const { key, name, ...options } of specs) {
            try {
                const before = await hasIndex(db, collection, name)
                await db.collection(collection).createIndex(key, { name, ...options })
                if (before) {
                    console.log(`    = ${name}`)
                    existing++
                } else {
                    console.log(`    + ${name}  ${JSON.stringify(key)}`)
                    created++
                }
            } catch (err) {
                console.log(`    ! ${name} — ${err.message}`)
                failed++
            }
        }
    }

    console.log(`\n${created} created, ${existing} already present, ${failed} failed`)
    if (failed) {
        console.log(
            '\nTwo usual causes:\n' +
            '  E11000 on build  -> the data already violates the constraint. The index\n' +
            '                      is NOT in place, so nothing is enforcing uniqueness.\n' +
            '                      Find and resolve the duplicates, then re-run.\n' +
            '  IndexOptionsConflict -> an index of that name exists with different\n' +
            '                      options. Drop it and re-run.\n' +
            'Either way, do not leave schema.js and the cluster disagreeing.'
        )
        process.exitCode = 1
    }
}

async function hasIndex(db, collection, name) {
    try {
        const list = await db.collection(collection).indexes()
        return list.some((i) => i.name === name)
    } catch {
        return false // collection does not exist yet
    }
}

main()
    .catch((err) => {
        console.error('Failed:', err.message)
        process.exitCode = 2
    })
    .finally(() => client.close())
