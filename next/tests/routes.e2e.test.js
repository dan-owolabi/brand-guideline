import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

/**
 * End-to-end route tests against a running dev server and real Atlas.
 *
 * The unit suites prove the repo layer and the guard in isolation. This proves
 * the HTTP surface the CLIENT actually talks to: real cookies, real routing,
 * real JSON. Phase 4 rewired ~46 call sites onto these endpoints, and until
 * something exercised them past a 401 none of that was verified.
 *
 * Requires a server started with the same MONGODB_URI:
 *   npx next dev -p 3123
 *   E2E_BASE=http://localhost:3123 node --test tests/routes.e2e.test.js
 *
 * Skips loudly when E2E_BASE is unset.
 */

const BASE = process.env.E2E_BASE
let unavailable = BASE ? null : 'E2E_BASE not set (start a dev server first)'

/**
 * A real cookie jar, keyed by name.
 *
 * Better Auth sets several cookies (session token, and with cookieCache
 * enabled a signed session-data cookie too), and refreshes them on later
 * responses. Keeping a single concatenated string and replacing it wholesale
 * drops whichever cookie was not in the most recent response — which shows up
 * as a baffling "Not signed in" on the request straight after a successful one.
 */
const jar = new Map()

const cookieHeader = () =>
    [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')

function storeCookies(res) {
    const raw = typeof res.headers.getSetCookie === 'function'
        ? res.headers.getSetCookie()
        : [res.headers.get('set-cookie')].filter(Boolean)

    for (const line of raw) {
        const [pair] = line.split(';')
        const idx = pair.indexOf('=')
        if (idx < 1) continue
        const name = pair.slice(0, idx).trim()
        const value = pair.slice(idx + 1).trim()
        if (value === '' || /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(line)) jar.delete(name)
        else jar.set(name, value)
    }
}

let userId
let accountId
let brandId

function t(name, fn) {
    test(name, async (ctx) => {
        if (unavailable) return ctx.skip(unavailable)
        await fn(ctx)
    })
}

async function api(method, path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: {
            ...(body ? { 'content-type': 'application/json' } : {}),
            ...(jar.size ? { cookie: cookieHeader() } : {}),
            // Better Auth enforces a CSRF origin check. Browsers always send
            // this; Node's fetch does not, so it has to be explicit here.
            origin: BASE,
        },
        body: body ? JSON.stringify(body) : undefined,
    })
    storeCookies(res)
    const json = res.status === 204 ? null : await res.json().catch(() => null)
    return { status: res.status, json }
}

before(async () => {
    if (unavailable) return
    try {
        const ping = await fetch(`${BASE}/api/accounts`)
        if (!ping.ok && ping.status !== 401) throw new Error(`unexpected ${ping.status}`)
    } catch (err) {
        unavailable = `no server at ${BASE}: ${err.message}`
        return
    }

    /**
     * Warm every route before asserting anything.
     *
     * `next dev` compiles a route on its FIRST request, which can take tens of
     * seconds. Without this the suite fails differently depending on whether
     * the server happened to be warm — the first run after a restart blew the
     * 45s per-test timeout on unrelated tests, which looks exactly like a real
     * regression. Each request 401s or 400s harmlessly; only compilation
     * matters here.
     */
    const routes = [
        '/api/accounts', '/api/brands', '/api/brands/warm', '/api/brands/warm/draft',
        '/api/brands/warm/publish', '/api/brands/warm/assets', '/api/brands/warm/collections',
        '/api/collections/warm', '/api/collections/reorder', '/api/assets', '/api/assets/warm',
        '/api/assets/bulk', '/api/storage/presign', '/api/storage/delete',
        '/api/invites/warm', '/api/invites/warm/accept',
        '/api/accounts/warm/members', '/api/accounts/warm/invites',
        '/api/public/brands/warm', '/api/public/domain/warm',
    ]
    await Promise.all(routes.flatMap((p) => [
        fetch(`${BASE}${p}`).catch(() => {}),
        fetch(`${BASE}${p}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', origin: BASE },
            body: '{}',
        }).catch(() => {}),
    ]))
})

after(async () => {
    // Best-effort cleanup of whatever this run created.
    if (!unavailable && brandId) await api('DELETE', `/api/brands/${brandId}`)
})

describe('unauthenticated', () => {
    t('protected routes are 401', async () => {
        const saved = new Map(jar); jar.clear()
        for (const p of ['/api/accounts', '/api/brands?accountId=x']) {
            const { status } = await api('GET', p)
            assert.equal(status, 401, `${p} should be 401`)
        }
        jar.clear(); saved.forEach((v, k) => jar.set(k, v))
    })

    t('unknown invite token is 404, not 401 (public route)', async () => {
        const saved = new Map(jar); jar.clear()
        const { status } = await api('GET', `/api/invites/${randomUUID()}`)
        assert.equal(status, 404)
        jar.clear(); saved.forEach((v, k) => jar.set(k, v))
    })
})

describe('full lifecycle over HTTP', () => {
    t('sign up establishes a session cookie', async () => {
        const email = `e2e-${randomUUID().slice(0, 8)}@test.dev`
        const { status, json } = await api('POST', '/api/auth/sign-up/email', {
            email,
            password: 'correct-horse-battery',
            name: 'E2E User',
        })
        assert.ok(status < 400, `sign-up failed: ${status} ${JSON.stringify(json)}`)
        assert.ok(jar.size > 0, 'no session cookie was set')
        userId = json?.user?.id
        assert.ok(userId)
    })

    t('GET /api/accounts now returns 200', async () => {
        const { status, json } = await api('GET', '/api/accounts')
        assert.equal(status, 200)
        assert.ok(Array.isArray(json.accounts))
    })

    t('create an account', async () => {
        const { status, json } = await api('POST', '/api/accounts', {
            name: 'E2E Co',
            slug: `e2e-${randomUUID().slice(0, 8)}`,
        })
        assert.equal(status, 201, JSON.stringify(json))
        accountId = json.account._id
        assert.ok(accountId)
    })

    t('duplicate slug returns 409 with code "duplicate"', async () => {
        const slug = `dup-${randomUUID().slice(0, 8)}`
        await api('POST', '/api/accounts', { name: 'A', slug })
        const { status, json } = await api('POST', '/api/accounts', { name: 'B', slug })
        // This is what replaced the Postgres 23505 branch in the UI.
        assert.equal(status, 409)
        assert.equal(json.code, 'duplicate')
    })

    t('create a brand', async () => {
        const { status, json } = await api('POST', '/api/brands', {
            accountId,
            name: 'E2E Brand',
            slug: `e2eb-${randomUUID().slice(0, 8)}`,
            primaryColor: '#123456',
        })
        assert.equal(status, 201, JSON.stringify(json))
        brandId = json.brand._id
    })

    t('brand is reachable by id AND by slug', async () => {
        const byId = await api('GET', `/api/brands/${brandId}`)
        assert.equal(byId.status, 200)

        const slug = byId.json.brand.slug
        const bySlug = await api('GET', `/api/brands/${slug}`)
        assert.equal(bySlug.status, 200, 'slug resolution is what useBrandEditor relies on')
        assert.equal(bySlug.json.brand._id, brandId)
    })

    t('autosave the draft', async () => {
        const { status, json } = await api('PUT', `/api/brands/${brandId}/draft`, {
            draft: { tokens: {}, sections: [{ id: 'a', type: 'text' }] },
        })
        assert.equal(status, 200, JSON.stringify(json))
        assert.ok(json.savedAt)

        const read = await api('GET', `/api/brands/${brandId}`)
        assert.equal(read.json.brand.draft.sections.length, 1)
    })

    t('draft rejects a non-object body', async () => {
        const { status } = await api('PUT', `/api/brands/${brandId}/draft`, { draft: 'nope' })
        assert.equal(status, 400)
    })

    t('collections: create, reorder, list', async () => {
        const a = await api('POST', `/api/brands/${brandId}/collections`, { name: 'Logos' })
        const b = await api('POST', `/api/brands/${brandId}/collections`, { name: 'Colours' })
        assert.equal(a.status, 201)
        assert.equal(b.status, 201)

        const reordered = [b.json.collection._id, a.json.collection._id]
        const r = await api('POST', '/api/collections/reorder', { brandId, orderedIds: reordered })
        assert.equal(r.status, 200)
        assert.equal(r.json.modified, 2)

        const list = await api('GET', `/api/brands/${brandId}/collections`)
        assert.deepEqual(list.json.collections.map((c) => c._id), reordered)
    })

    t('assets: create with a client id, then bulk delete', async () => {
        // The copy-section flow depends on client-supplied ids surviving.
        const chosen = randomUUID()
        const created = await api('POST', '/api/assets', {
            brandId,
            assets: [{ _id: chosen, name: 'logo.svg', fileUrl: 'https://x/logo.svg' }],
        })
        assert.equal(created.status, 201, JSON.stringify(created.json))
        assert.equal(created.json.assets[0]._id, chosen, 'client-supplied id was not honoured')

        const listed = await api('GET', `/api/brands/${brandId}/assets`)
        assert.equal(listed.json.assets.length, 1)

        const del = await api('POST', '/api/assets/bulk', {
            brandId, op: 'delete', ids: [chosen],
        })
        assert.equal(del.status, 200)
        assert.equal(del.json.deletedCount, 1)
    })

    t('operator injection in ids is rejected', async () => {
        const { status } = await api('POST', '/api/assets/bulk', {
            brandId, op: 'delete', ids: [{ $ne: null }],
        })
        assert.equal(status, 400)
    })

    t('publish, then the brand is publicly readable without a cookie', async () => {
        const pub = await api('POST', `/api/brands/${brandId}/publish`, { publishMode: 'both' })
        assert.equal(pub.status, 200, `publish failed: ${JSON.stringify(pub.json)}`)

        // The account must be published too, or the public repo refuses.
        const patched = await api('PATCH', `/api/accounts/${accountId}`, { isPublished: true })
        assert.equal(patched.status, 200, `account patch failed: ${JSON.stringify(patched.json)}`)
        assert.equal(patched.json.account.isPublished, true, `isPublished not persisted: ${JSON.stringify(patched.json.account)}`)

        const slug = pub.json.brand.slug
        const saved = new Map(jar); jar.clear()
        const anon = await api('GET', `/api/public/brands/${slug}`)
        jar.clear(); saved.forEach((v, k) => jar.set(k, v))

        assert.equal(anon.status, 200,
            `published brand should be anonymously readable (slug=${slug}) -> ${JSON.stringify(anon.json)}`)
        assert.ok(anon.json.brand)
        // The leak that existed on Supabase must not reappear.
        assert.equal(anon.json.brand.draft, undefined, 'draft must never reach an anonymous caller')
        assert.equal(anon.json.brand.billingEmail, undefined)
    })

    t('storage presign requires auth, and reports 503 when unconfigured', async () => {
        const saved = new Map(jar); jar.clear()
        const anon = await api('POST', '/api/storage/presign', {
            accountId, filename: 'x.png', contentType: 'image/png', contentLength: 10,
        })
        // Unauthenticated must never reach the storage layer.
        assert.ok([401, 503].includes(anon.status), `got ${anon.status}`)
        jar.clear(); saved.forEach((v, k) => jar.set(k, v))

        const authed = await api('POST', '/api/storage/presign', {
            accountId, filename: 'x.png', contentType: 'image/png', contentLength: 10,
        })
        if (authed.status === 503) {
            assert.equal(authed.json.code, 'storage_unconfigured')
            return // R2 credentials absent — the rest cannot be exercised here.
        }
        assert.equal(authed.status, 200)
        assert.ok(authed.json.uploadUrl)
        // The key must be prefixed with OUR account, from ctx and not the body.
        assert.ok(authed.json.key.startsWith(`acct/${accountId}/`), authed.json.key)
    })

    t('storage rejects a disallowed content type and oversize files', async () => {
        const html = await api('POST', '/api/storage/presign', {
            accountId, filename: 'x.html', contentType: 'text/html', contentLength: 10,
        })
        assert.ok([415, 503].includes(html.status), `got ${html.status}`)

        const huge = await api('POST', '/api/storage/presign', {
            accountId, filename: 'x.png', contentType: 'image/png', contentLength: 99 * 1024 * 1024,
        })
        assert.ok([413, 503].includes(huge.status), `got ${huge.status}`)
    })

    t('another user cannot touch this brand', async () => {
        const mine = new Map(jar); jar.clear()

        const email = `other-${randomUUID().slice(0, 8)}@test.dev`
        await api('POST', '/api/auth/sign-up/email', {
            email, password: 'correct-horse-battery', name: 'Other',
        })

        // 404 rather than 403: a 403 would confirm the brand exists.
        const read = await api('GET', `/api/brands/${brandId}`)
        assert.equal(read.status, 404)

        const write = await api('PUT', `/api/brands/${brandId}/draft`, { draft: { hacked: true } })
        assert.equal(write.status, 404)

        jar.clear(); mine.forEach((v, k) => jar.set(k, v))

        // And the draft is untouched.
        const check = await api('GET', `/api/brands/${brandId}`)
        assert.equal(check.json.brand.draft.hacked, undefined)
    })
})
