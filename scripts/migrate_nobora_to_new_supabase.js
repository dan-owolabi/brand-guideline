/**
 * Migration Script: Nobora Brand Guide
 * From: Old Supabase (vggbfpiknefwtccdhsvr)
 * To: New Supabase (ahfsosoabcvxgcwharui)
 * Target User: owolabidaniel30@gmail.com
 *
 * Run with: node --env-file=.env.local scripts/migrate_nobora_to_new_supabase.js
 * (from the repo root, so the generated SQL file path below resolves correctly)
 * Requires SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const oldClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

function escapeSql(val) {
    if (val === null || val === undefined) return 'NULL'
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
    if (typeof val === 'number') return String(val)
    if (Array.isArray(val) || typeof val === 'object') {
        return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`
    }
    return `'${String(val).replace(/'/g, "''")}'`
}

function escapeText(val) {
    if (val === null || val === undefined) return 'NULL'
    return `'${String(val).replace(/'/g, "''")}'`
}

async function run() {
    console.log('=== NOBORA BRAND MIGRATION ===\n')
    console.log('Fetching data from OLD Supabase...\n')

    // 1. Fetch Brand
    const { data: brands, error: brandError } = await oldClient
        .from('brands')
        .select('*')
        .eq('name', 'Nobora')

    if (brandError || !brands || brands.length === 0) {
        console.error('Error or no brand found:', brandError)
        return
    }

    const oldBrand = brands[0]
    console.log(`✓ Found Brand: ${oldBrand.name} (${oldBrand.id})`)

    // 2. Fetch Assets
    const { data: assets, error: assetsError } = await oldClient
        .from('assets')
        .select('*')
        .eq('brand_id', oldBrand.id)

    if (assetsError) {
        console.error('Error fetching assets:', assetsError)
    }
    console.log(`✓ Found ${assets?.length || 0} assets`)

    // 3. Generate SQL for new schema
    const targetEmail = 'owolabidaniel30@gmail.com'

    let sql = `-- ============================================
-- NOBORA BRAND MIGRATION
-- Target: ${targetEmail}
-- Generated: ${new Date().toISOString()}
-- ============================================

DO $nobora_migration$
DECLARE
    v_user_id UUID;
    v_workspace_id UUID;
    v_brand_id UUID;
BEGIN
    -- 1. Find user by email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = '${targetEmail}';

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User % not found. Please ensure the user has signed up first.', '${targetEmail}';
    END IF;

    RAISE NOTICE 'Found user: %', v_user_id;

    -- 2. Find or create workspace for user
    SELECT w.id INTO v_workspace_id
    FROM workspaces w
    JOIN workspace_members wm ON w.id = wm.workspace_id
    WHERE wm.user_id = v_user_id
    LIMIT 1;

    IF v_workspace_id IS NULL THEN
        -- Create new workspace
        INSERT INTO workspaces (name, slug, owner_id)
        VALUES (
            'My Workspace',
            'my-workspace-' || substr(md5(random()::text), 1, 8),
            v_user_id
        )
        RETURNING id INTO v_workspace_id;

        -- Add user as owner member
        INSERT INTO workspace_members (workspace_id, user_id, role, can_invite)
        VALUES (v_workspace_id, v_user_id, 'owner', true);

        RAISE NOTICE 'Created new workspace: %', v_workspace_id;
    ELSE
        RAISE NOTICE 'Using existing workspace: %', v_workspace_id;
    END IF;

    -- 3. Create brand
    INSERT INTO brands (
        workspace_id,
        name,
        slug,
        logo_url,
        banner_url,
        primary_color,
        font_family
    ) VALUES (
        v_workspace_id,
        ${escapeText(oldBrand.name)},
        ${escapeText(oldBrand.name.toLowerCase().replace(/\s+/g, '-'))},
        ${escapeText(oldBrand.logo_url)},
        ${escapeText(oldBrand.banner_url)},
        ${escapeText(oldBrand.primary_color || '#0066FF')},
        'Geist'
    )
    RETURNING id INTO v_brand_id;

    RAISE NOTICE 'Created brand: %', v_brand_id;

    -- 4. Create brand_drafts with content
    INSERT INTO brand_drafts (brand_id, content, version)
    VALUES (
        v_brand_id,
        ${escapeSql(oldBrand.draft || { sections: [] })},
        1
    );

    RAISE NOTICE 'Created brand draft';

    -- 5. Create brand_published with content (if exists)
`

    if (oldBrand.published && Object.keys(oldBrand.published).length > 0) {
        sql += `    INSERT INTO brand_published (brand_id, content, version, published_by)
    VALUES (
        v_brand_id,
        ${escapeSql(oldBrand.published)},
        1,
        v_user_id
    );

    RAISE NOTICE 'Created published version';
`
    }

    // Add assets
    if (assets && assets.length > 0) {
        sql += `
    -- 6. Import assets
`
        for (const asset of assets) {
            sql += `    INSERT INTO assets (
        workspace_id,
        brand_id,
        name,
        file_path,
        file_type,
        file_size,
        mime_type,
        uploaded_by
    ) VALUES (
        v_workspace_id,
        v_brand_id,
        ${escapeText(asset.name)},
        ${escapeText(asset.file_url || asset.file_path || '')},
        ${escapeText(asset.file_type)},
        ${asset.file_size || 'NULL'},
        ${escapeText(asset.file_type)},
        v_user_id
    );
`
        }
        sql += `    RAISE NOTICE 'Imported ${assets.length} assets';
`
    }

    sql += `
    RAISE NOTICE '=== MIGRATION COMPLETE ===';
    RAISE NOTICE 'Brand ID: %', v_brand_id;
    RAISE NOTICE 'Workspace ID: %', v_workspace_id;

END $nobora_migration$;

-- Verification query (run separately)
-- SELECT b.id, b.name, b.slug, w.name as workspace_name
-- FROM brands b
-- JOIN workspaces w ON b.workspace_id = w.id
-- WHERE b.name = 'Nobora';
`

    // Write SQL file
    const outputPath = 'supabase/migrations/fixes/016_import_nobora_final.sql'
    fs.writeFileSync(outputPath, sql)

    console.log(`\n✓ SQL file generated: ${outputPath}`)
    console.log(`\nNext steps:`)
    console.log(`1. Ensure ${targetEmail} has signed up on the new Supabase`)
    console.log(`2. Go to new Supabase Dashboard > SQL Editor`)
    console.log(`3. Copy and run the contents of ${outputPath}`)
    console.log(`4. Verify the brand appears in the app`)
}

run().catch(console.error)
