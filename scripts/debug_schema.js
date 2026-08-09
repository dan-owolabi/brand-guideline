/**
 * Run with: node --env-file=.env.local scripts/debug_schema.js
 * Requires SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local (same project as VITE_SUPABASE_URL)
 */

import { createClient } from '@supabase/supabase-js'

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
    console.log('--- DEBUG SCHEMA ---')

    // 1. Fetch 1 Page to see if ANY exist
    const { count: totalPages, error: countError } = await client.from('pages').select('*', { count: 'exact', head: true })
    const { count: totalAssets } = await client.from('assets').select('*', { count: 'exact', head: true })
    console.log('Total Pages in DB:', totalPages)
    if (countError) console.log('Pages count error:', countError)
    console.log('Total Assets in DB:', totalAssets)

    // 2. Fetch Brand Data
    const { data: brands } = await client.from('brands').select('*').eq('name', 'Nobora')
    if (brands && brands.length > 0) {
        const b = brands[0]
        console.log('Nobora Brand ID:', b.id)

        console.log('Draft keys:', b.draft ? Object.keys(b.draft) : 'null')
        console.log('Published keys:', b.published ? Object.keys(b.published) : 'null')
        console.log('Navigation:', JSON.stringify(b.navigation))

        if (b.draft && b.draft.sections && Array.isArray(b.draft.sections)) {
            console.log('Section Count:', b.draft.sections.length)
            const summary = b.draft.sections.map((s, i) => ({
                index: i,
                keys: Object.keys(s),
                id: s.id,
                name: s.name || s.title || 'No Name',
                hasBlocks: s.blocks ? Array.isArray(s.blocks) : 'no-blocks-key',
                type: s.type
            }))
            console.log('Sections Summary:', JSON.stringify(summary, null, 2))
        }

        if (b.published) {
            console.log('Published keys:', Object.keys(b.published))
        }
    } else {
        console.log('Nobora Brand not found.')
    }
}

run()
