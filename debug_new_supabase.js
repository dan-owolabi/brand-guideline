/**
 * Debug script to check brand data in new Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const NEW_URL = 'https://ahfsosoabcvxgcwharui.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZnNvc29hYmN2eGdjd2hhcnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTU1NCwiZXhwIjoyMDg0NzA1NTU0fQ.a1d9DnNP9nxg3ThS5jrfpUXVZIzqGRcfSBMgM1W7uso';

const client = createClient(NEW_URL, NEW_KEY);

async function run() {
    console.log('=== DEBUG NEW SUPABASE DATA ===\n');

    // Check brands
    const { data: brands, error: brandError } = await client
        .from('brands')
        .select('*')
        .eq('name', 'Nobora');

    console.log('Brands found:', brands?.length || 0);
    if (brands && brands.length > 0) {
        console.log('Brand ID:', brands[0].id);
        console.log('Workspace ID:', brands[0].workspace_id);
    }

    // Check brand_drafts
    if (brands && brands.length > 0) {
        const { data: drafts, error: draftError } = await client
            .from('brand_drafts')
            .select('*')
            .eq('brand_id', brands[0].id);

        console.log('\nDrafts found:', drafts?.length || 0);
        if (drafts && drafts.length > 0) {
            console.log('Draft ID:', drafts[0].id);
            console.log('Content keys:', drafts[0].content ? Object.keys(drafts[0].content) : 'null');
            if (drafts[0].content && drafts[0].content.sections) {
                console.log('Sections count:', drafts[0].content.sections.length);
                console.log('First section:', drafts[0].content.sections[0]?.title || 'no title');
            }
        }
        if (draftError) {
            console.log('Draft error:', draftError);
        }
    }

    // Check brand_published
    if (brands && brands.length > 0) {
        const { data: published } = await client
            .from('brand_published')
            .select('*')
            .eq('brand_id', brands[0].id);

        console.log('\nPublished found:', published?.length || 0);
        if (published && published.length > 0) {
            console.log('Published content keys:', published[0].content ? Object.keys(published[0].content) : 'null');
        }
    }
}

run().catch(console.error);
