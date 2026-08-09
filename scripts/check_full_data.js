/**
 * Check RLS policies and data access
 *
 * Run with: node --env-file=.env.local scripts/check_full_data.js
 * Requires NOBORA_SUPABASE_URL / NOBORA_SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'

const client = createClient(process.env.NOBORA_SUPABASE_URL, process.env.NOBORA_SUPABASE_SERVICE_ROLE_KEY)

async function run() {
    console.log('=== FULL DATA CHECK ===\n')

    // Get the brand
    const { data: brand } = await client
        .from('brands')
        .select('*')
        .eq('name', 'Nobora')
        .single()

    console.log('Brand ID:', brand?.id)
    console.log('Brand workspace_id:', brand?.workspace_id)

    // Get the draft
    const { data: draft, error: draftErr } = await client
        .from('brand_drafts')
        .select('*')
        .eq('brand_id', brand.id)
        .single()

    console.log('\nDraft:', draft ? 'EXISTS' : 'NOT FOUND')
    if (draftErr) console.log('Draft error:', draftErr.message)

    if (draft) {
        console.log('Draft ID:', draft.id)
        console.log('Draft content type:', typeof draft.content)
        console.log('Draft content keys:', Object.keys(draft.content || {}))

        if (draft.content?.sections) {
            console.log('Sections count:', draft.content.sections.length)
            draft.content.sections.forEach((s, i) => {
                console.log(`  ${i}: ${s.title} (${s.blocks?.length || 0} blocks)`)
            })
        }
    }

    // Check workspace_members
    const { data: members } = await client
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', brand.workspace_id)

    console.log('\nWorkspace members:', members?.length || 0)
    members?.forEach(m => {
        console.log(`  User: ${m.user_id}, Role: ${m.role}`)
    })
}

run().catch(console.error)
