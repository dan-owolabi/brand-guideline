/**
 * Check RLS policies and data access
 */

const { createClient } = require('@supabase/supabase-js');

const NEW_URL = 'https://ahfsosoabcvxgcwharui.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZnNvc29hYmN2eGdjd2hhcnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTU1NCwiZXhwIjoyMDg0NzA1NTU0fQ.a1d9DnNP9nxg3ThS5jrfpUXVZIzqGRcfSBMgM1W7uso';

const client = createClient(NEW_URL, NEW_KEY);

async function run() {
    console.log('=== FULL DATA CHECK ===\n');

    // Get the brand
    const { data: brand } = await client
        .from('brands')
        .select('*')
        .eq('name', 'Nobora')
        .single();

    console.log('Brand ID:', brand?.id);
    console.log('Brand workspace_id:', brand?.workspace_id);

    // Get the draft
    const { data: draft, error: draftErr } = await client
        .from('brand_drafts')
        .select('*')
        .eq('brand_id', brand.id)
        .single();

    console.log('\nDraft:', draft ? 'EXISTS' : 'NOT FOUND');
    if (draftErr) console.log('Draft error:', draftErr.message);

    if (draft) {
        console.log('Draft ID:', draft.id);
        console.log('Draft content type:', typeof draft.content);
        console.log('Draft content keys:', Object.keys(draft.content || {}));

        if (draft.content?.sections) {
            console.log('Sections count:', draft.content.sections.length);
            draft.content.sections.forEach((s, i) => {
                console.log(`  ${i}: ${s.title} (${s.blocks?.length || 0} blocks)`);
            });
        }
    }

    // Check workspace_members
    const { data: members } = await client
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', brand.workspace_id);

    console.log('\nWorkspace members:', members?.length || 0);
    members?.forEach(m => {
        console.log(`  User: ${m.user_id}, Role: ${m.role}`);
    });
}

run().catch(console.error);
