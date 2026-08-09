/**
 * Debug script to check brand data in new Supabase
 *
 * Run with: node --env-file=.env.local scripts/debug_new_supabase.js
 * Requires NOBORA_SUPABASE_URL / NOBORA_SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'

const client = createClient(process.env.NOBORA_SUPABASE_URL, process.env.NOBORA_SUPABASE_SERVICE_ROLE_KEY)

async function run() {
    console.log('=== DEBUG NEW SUPABASE DATA ===\n')

    // Check brands
    const { data: brands, error: brandError } = await client
        .from('brands')
        .select('*')
        .eq('name', 'Nobora')

    console.log('Brands found:', brands?.length || 0)
    if (brandError) {
        console.log('Brand error:', brandError)
    }
    if (brands && brands.length > 0) {
        console.log('Brand ID:', brands[0].id)
        console.log('Workspace ID:', brands[0].workspace_id)
    }

    // Check brand_drafts
    if (brands && brands.length > 0) {
        const { data: drafts, error: draftError } = await client
            .from('brand_drafts')
            .select('*')
            .eq('brand_id', brands[0].id)

        console.log('\nDrafts found:', drafts?.length || 0)
        if (drafts && drafts.length > 0) {
            console.log('Draft ID:', drafts[0].id)
            console.log('Content keys:', drafts[0].content ? Object.keys(drafts[0].content) : 'null')
            if (drafts[0].content && drafts[0].content.sections) {
                console.log('Sections count:', drafts[0].content.sections.length)
                console.log('First section:', drafts[0].content.sections[0]?.title || 'no title')
            }
        }
        if (draftError) {
            console.log('Draft error:', draftError)
        }
    }

    // Check brand_published
    if (brands && brands.length > 0) {
        const { data: published } = await client
            .from('brand_published')
            .select('*')
            .eq('brand_id', brands[0].id)

        console.log('\nPublished found:', published?.length || 0)
        if (published && published.length > 0) {
            console.log('Published content keys:', published[0].content ? Object.keys(published[0].content) : 'null')
        }
    }
}

run().catch(console.error)
