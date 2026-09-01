import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { resolveHost, stripPort } from '../src/lib/domains.js'

/**
 * Host resolution decides which shell every request gets, before any React
 * runs. A wrong answer here either shows the marketing page on a customer's
 * domain or exposes the authenticated shell publicly, so it is worth pinning
 * precisely — especially the ordering between the staging and production
 * bases, where a naive suffix match would treat "staging" as a brand slug.
 */

const ctx = (host, search) =>
    resolveHost(host, search ? new URLSearchParams(search) : undefined)

describe('production hosts', () => {
    test('apex and www are marketing', () => {
        assert.equal(ctx('guidr.space').type, 'marketing')
        assert.equal(ctx('www.guidr.space').type, 'marketing')
    })

    test('app subdomain is the authenticated shell', () => {
        assert.equal(ctx('app.guidr.space').type, 'app')
    })

    test('brand subdomain resolves to its slug', () => {
        assert.deepEqual(ctx('acme.guidr.space'), { type: 'brand', brand: 'acme' })
    })

    test('unknown host is a custom domain', () => {
        assert.deepEqual(ctx('brand.acme.com'), { type: 'custom', hostname: 'brand.acme.com' })
    })
})

describe('staging hosts', () => {
    test('staging apex is marketing, not a brand named "staging"', () => {
        assert.equal(ctx('staging.guidr.space').type, 'marketing')
    })

    test('www.staging is marketing', () => {
        assert.equal(ctx('www.staging.guidr.space').type, 'marketing')
    })

    test('app.staging is the authenticated shell', () => {
        assert.equal(ctx('app.staging.guidr.space').type, 'app')
    })

    test('brand under staging resolves against the staging base', () => {
        // The staging base must be tried first; otherwise the production base
        // would match and yield the slug "acme.staging".
        assert.deepEqual(ctx('acme.staging.guidr.space'), { type: 'brand', brand: 'acme' })
    })
})

describe('reserved and malformed subdomains', () => {
    for (const sub of ['www', 'app', 'api', 'admin', 'cdn', 'assets', 'static', 'mail', 'staging']) {
        test(`"${sub}" never resolves to a brand`, () => {
            assert.notEqual(ctx(`${sub}.guidr.space`).type, 'brand')
        })
    }

    test('nested subdomain does not become a slug containing a dot', () => {
        assert.equal(ctx('a.b.guidr.space').type, 'marketing')
    })
})

describe('vercel preview deployments', () => {
    test('raw vercel.app URLs get the app shell', () => {
        assert.equal(ctx('brandguide-staging.vercel.app').type, 'app')
        assert.equal(ctx('brandguide-git-main-danny.vercel.app').type, 'app')
    })
})

describe('local development', () => {
    test('localhost defaults to the app shell', () => {
        assert.equal(ctx('localhost').type, 'app')
        assert.equal(ctx('127.0.0.1').type, 'app')
    })

    test('_context simulates each shell', () => {
        assert.equal(ctx('localhost', '_context=marketing').type, 'marketing')
        assert.equal(ctx('localhost', '_context=app').type, 'app')
        assert.deepEqual(ctx('localhost', '_context=acme'), { type: 'brand', brand: 'acme' })
    })
})

describe('normalisation', () => {
    test('port is ignored', () => {
        assert.equal(ctx('localhost:3000').type, 'app')
        assert.deepEqual(ctx('acme.guidr.space:443'), { type: 'brand', brand: 'acme' })
    })

    test('host matching is case-insensitive', () => {
        assert.equal(ctx('APP.GUIDR.SPACE').type, 'app')
        assert.deepEqual(ctx('ACME.Guidr.Space'), { type: 'brand', brand: 'acme' })
    })

    test('stripPort helper', () => {
        assert.equal(stripPort('Example.COM:8080'), 'example.com')
    })

    test('empty host does not throw', () => {
        assert.doesNotThrow(() => ctx(''))
    })
})
