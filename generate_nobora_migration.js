const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Old Project Config
const OLD_URL = 'https://vggbfpiknefwtccdhsvr.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnZ2JmcGlrbmVmd3RjY2Roc3ZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzODY1MiwiZXhwIjoyMDgzNjE0NjUyfQ.YePS4d3UpxfaaxyvZWcNO2Ef54VgApCA4rJVOayfwxo';

const oldClient = createClient(OLD_URL, OLD_KEY);

function escapeSql(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'number') return val;
    if (Array.isArray(val) || typeof val === 'object') {
        return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    }
    return `'${String(val).replace(/'/g, "''")}'`;
}

function slugify(text) {
    return (text || 'untitled').toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

async function run() {
    console.log('Fetching Nobora brand from OLD project...');

    // 1. Fetch Brand
    const { data: brands, error: brandError } = await oldClient
        .from('brands')
        .select('*')
        .eq('name', 'Nobora');

    if (brandError || !brands || brands.length === 0) {
        console.error('Error or no brand found:', brandError);
        return;
    }

    const oldBrand = brands[0];
    console.log(`Found Brand: ${oldBrand.name} (${oldBrand.id})`);

    // 2. Extract Pages from Draft JSON
    let pages = [];
    let blocksMap = {}; // page_old_id -> blocks array

    if (oldBrand.draft && Array.isArray(oldBrand.draft.sections)) {
        console.log(`Found ${oldBrand.draft.sections.length} sections in draft JSON.`);

        pages = oldBrand.draft.sections.map((section, index) => {
            const pageId = section.id || `custom-page-${index}`;
            const page = {
                id: pageId, // temporary ID for mapping
                slug: section.slug || slugify(section.name || section.title),
                title: section.name || section.title || 'Untitled Page',
                order: index
            };

            // Blocks
            if (Array.isArray(section.blocks)) {
                blocksMap[pageId] = section.blocks.map((b, bIndex) => ({
                    type: b.type,
                    data: b.content || b.data || {},
                    order: bIndex
                }));
            } else {
                blocksMap[pageId] = [];
            }

            return page;
        });
    } else {
        console.log('No sections in draft JSON. Checking relational tables...');
        // Fallback to relational check just in case
        const { data: relPages } = await oldClient.from('pages').select('*').eq('brand_id', oldBrand.id);
        if (relPages && relPages.length > 0) {
            pages = relPages;
            // Fetch blocks for these
            const pageIds = pages.map(p => p.id);
            const { data: relBlocks } = await oldClient.from('blocks').select('*').in('page_id', pageIds);
            // Group blocks
            relBlocks.forEach(b => {
                if (!blocksMap[b.page_id]) blocksMap[b.page_id] = [];
                blocksMap[b.page_id].push(b);
            });
        }
    }

    console.log(`Prepared ${pages.length} pages for migration.`);

    // 3. Fetch Collections & Assets (Best Effort)
    const { data: collections } = await oldClient.from('collections').select('*').eq('brand_id', oldBrand.id);
    const { data: assets } = await oldClient.from('assets').select('*').eq('brand_id', oldBrand.id);

    console.log(`Found ${collections?.length || 0} collections.`);
    console.log(`Found ${assets?.length || 0} assets.`);

    // --- GENERATE SQL ---
    let sql = `DO $migration$
DECLARE
    v_user_email TEXT := 'owolabidaniel30@gmail.com';
    v_user_id UUID;
    v_workspace_id UUID;
    v_new_brand_id UUID;
    
    -- ID Mappings
    ${pages.map((p, i) => `v_page_${i} UUID;`).join('\n    ')}
    ${(collections || []).map((c, i) => `v_col_${i} UUID;`).join('\n    ')}
BEGIN
    -- 1. Get User
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User % not found', v_user_email;
    END IF;

    -- 2. Get/Create Workspace
    -- Attempt to find a workspace owned by user
    SELECT id INTO v_workspace_id FROM workspaces WHERE owner_id = v_user_id LIMIT 1;
    
    IF v_workspace_id IS NULL THEN
        -- Create default workspace
        INSERT INTO workspaces (name, slug, owner_id)
        VALUES ('My Workspace', 'my-workspace-' || substr(md5(random()::text), 1, 6), v_user_id)
        RETURNING id INTO v_workspace_id;
    END IF;

    -- 3. Insert Brand
    INSERT INTO brands (
        name, logo_url, banner_url, primary_color, navigation, 
        draft, published, workspace_id
    ) VALUES (
        ${escapeSql(oldBrand.name + ' (Imported)')},
        ${escapeSql(oldBrand.logo_url)},
        ${escapeSql(oldBrand.banner_url)},
        ${escapeSql(oldBrand.primary_color)},
        ${escapeSql(oldBrand.navigation)},
        ${escapeSql(oldBrand.draft)}, -- Keep original draft as backup
        ${escapeSql(oldBrand.published)},
        v_workspace_id
    ) RETURNING id INTO v_new_brand_id;

    RAISE NOTICE 'Created Brand ID: %', v_new_brand_id;

    -- 4. Insert Collections
    ${(collections || []).map((c, i) => `
    INSERT INTO collections (brand_id, name)
    VALUES (v_new_brand_id, ${escapeSql(c.name)})
    RETURNING id INTO v_col_${i};
    `).join('\n')}

    -- 5. Insert Pages & Blocks
    ${pages.map((p, i) => `
    -- Page: ${p.title}
    INSERT INTO pages (brand_id, slug, title, "order")
    VALUES (v_new_brand_id, ${escapeSql(p.slug)}, ${escapeSql(p.title)}, ${escapeSql(p.order)})
    RETURNING id INTO v_page_${i};

    -- Blocks for Page ${i}
    ${(blocksMap[p.id] || []).map(b => `
    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_${i}, ${escapeSql(b.type)}, ${escapeSql(b.data)}, ${escapeSql(b.order)});
    `).join('\n')}
    `).join('\n')}

    -- 6. Insert Assets
    ${(assets || []).map(a => {
        let colRef = 'NULL';
        if (a.collection_id) {
            // Find index of collection
            const colIndex = collections.findIndex(c => c.id === a.collection_id);
            if (colIndex !== -1) {
                colRef = `v_col_${colIndex}`;
            }
        }
        return `
    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        ${escapeSql(a.name)},
        ${escapeSql(a.description)},
        ${escapeSql(a.file_url)},
        ${escapeSql(a.thumbnail_url)},
        ${escapeSql(a.file_type)},
        ${escapeSql(a.file_size)},
        ${escapeSql(a.category)},
        ${escapeSql(a.tags)},
        ${colRef}
    );`;
    }).join('\n')}

    RAISE NOTICE 'Migration completed successfully.';
END $migration$ LANGUAGE plpgsql;
`;

    fs.writeFileSync('supabase/migrations/fixes/007_import_nobora.sql', sql);
    console.log('SQL file generated at supabase/migrations/fixes/007_import_nobora.sql');
}

run();
