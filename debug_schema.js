const { createClient } = require('@supabase/supabase-js');

// Old Project Config
const OLD_URL = 'https://vggbfpiknefwtccdhsvr.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnZ2JmcGlrbmVmd3RjY2Roc3ZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzODY1MiwiZXhwIjoyMDgzNjE0NjUyfQ.YePS4d3UpxfaaxyvZWcNO2Ef54VgApCA4rJVOayfwxo';

const oldClient = createClient(OLD_URL, OLD_KEY);

async function run() {
    console.log('--- DEBUG SCHEMA ---');

    // 1. Fetch 1 Page to see if ANY exist
    const { count: totalPages, error: countError } = await oldClient.from('pages').select('*', { count: 'exact', head: true });
    const { count: totalAssets } = await oldClient.from('assets').select('*', { count: 'exact', head: true });
    console.log('Total Pages in DB:', totalPages);
    console.log('Total Assets in DB:', totalAssets);

    // 2. Fetch Brand Data
    const { data: brands } = await oldClient.from('brands').select('*').eq('name', 'Nobora');
    if (brands && brands.length > 0) {
        const b = brands[0];
        console.log('Nobora Brand ID:', b.id);

        console.log('Draft keys:', b.draft ? Object.keys(b.draft) : 'null');
        console.log('Published keys:', b.published ? Object.keys(b.published) : 'null');
        console.log('Navigation:', JSON.stringify(b.navigation));

        if (b.draft && b.draft.sections && Array.isArray(b.draft.sections)) {
            console.log('Section Count:', b.draft.sections.length);
            const summary = b.draft.sections.map((s, i) => ({
                index: i,
                keys: Object.keys(s),
                id: s.id,
                name: s.name || s.title || 'No Name',
                hasBlocks: s.blocks ? Array.isArray(s.blocks) : 'no-blocks-key',
                type: s.type
            }));
            console.log('Sections Summary:', JSON.stringify(summary, null, 2));
        }

        if (b.published) {
            console.log('Published keys:', Object.keys(b.published));
        }
    } else {
        console.log('Nobora Brand not found.');
    }
}

run();
