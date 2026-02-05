/**
 * Direct API Migration Script: Nobora Brand Guide
 * From: Old Supabase (vggbfpiknefwtccdhsvr)
 * To: New Supabase (ahfsosoabcvxgcwharui)
 * Target User: owolabidaniel30@gmail.com
 */

const { createClient } = require('@supabase/supabase-js');

// Old Project Config (source)
const OLD_URL = 'https://vggbfpiknefwtccdhsvr.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnZ2JmcGlrbmVmd3RjY2Roc3ZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzODY1MiwiZXhwIjoyMDgzNjE0NjUyfQ.YePS4d3UpxfaaxyvZWcNO2Ef54VgApCA4rJVOayfwxo';

// New Project Config (destination)
const NEW_URL = 'https://ahfsosoabcvxgcwharui.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZnNvc29hYmN2eGdjd2hhcnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTU1NCwiZXhwIjoyMDg0NzA1NTU0fQ.a1d9DnNP9nxg3ThS5jrfpUXVZIzqGRcfSBMgM1W7uso';

const oldClient = createClient(OLD_URL, OLD_KEY);
const newClient = createClient(NEW_URL, NEW_KEY);

const TARGET_EMAIL = 'owolabidaniel30@gmail.com';

async function run() {
    console.log('=== NOBORA BRAND MIGRATION (Direct API) ===\n');

    // 1. Fetch from OLD Supabase
    console.log('1. Fetching data from OLD Supabase...');

    const { data: brands, error: brandError } = await oldClient
        .from('brands')
        .select('*')
        .eq('name', 'Nobora');

    if (brandError || !brands || brands.length === 0) {
        console.error('Error or no brand found:', brandError);
        return;
    }

    const oldBrand = brands[0];
    console.log(`   ✓ Found Brand: ${oldBrand.name} (${oldBrand.id})`);

    const { data: assets } = await oldClient
        .from('assets')
        .select('*')
        .eq('brand_id', oldBrand.id);

    console.log(`   ✓ Found ${assets?.length || 0} assets`);

    // 2. Find user in NEW Supabase
    console.log('\n2. Finding user in NEW Supabase...');

    const { data: userData, error: userError } = await newClient.auth.admin.listUsers();

    if (userError) {
        console.error('Error fetching users:', userError);
        return;
    }

    const targetUser = userData.users.find(u => u.email === TARGET_EMAIL);

    if (!targetUser) {
        console.error(`User ${TARGET_EMAIL} not found. Please ensure they have signed up first.`);
        return;
    }

    console.log(`   ✓ Found user: ${targetUser.id}`);

    // 3. Find or create workspace
    console.log('\n3. Finding or creating workspace...');

    let workspaceId;

    const { data: existingWorkspaces } = await newClient
        .from('workspaces')
        .select('id')
        .eq('owner_id', targetUser.id)
        .limit(1);

    if (existingWorkspaces && existingWorkspaces.length > 0) {
        workspaceId = existingWorkspaces[0].id;
        console.log(`   ✓ Using existing workspace: ${workspaceId}`);
    } else {
        // Create workspace
        const { data: newWorkspace, error: wsError } = await newClient
            .from('workspaces')
            .insert({
                name: 'My Workspace',
                slug: 'my-workspace-' + Math.random().toString(36).substring(2, 8),
                owner_id: targetUser.id
            })
            .select()
            .single();

        if (wsError) {
            console.error('Error creating workspace:', wsError);
            return;
        }

        workspaceId = newWorkspace.id;
        console.log(`   ✓ Created workspace: ${workspaceId}`);

        // Add user as member
        const { error: memberError } = await newClient
            .from('workspace_members')
            .insert({
                workspace_id: workspaceId,
                user_id: targetUser.id,
                role: 'owner',
                can_invite: true
            });

        if (memberError) {
            console.error('Error adding member:', memberError);
        }
    }

    // 4. Create brand
    console.log('\n4. Creating brand...');

    const { data: newBrand, error: brandInsertError } = await newClient
        .from('brands')
        .insert({
            workspace_id: workspaceId,
            name: oldBrand.name,
            slug: oldBrand.name.toLowerCase().replace(/\s+/g, '-'),
            logo_url: oldBrand.logo_url,
            banner_url: oldBrand.banner_url,
            primary_color: oldBrand.primary_color || '#0066FF',
            font_family: 'Geist'
        })
        .select()
        .single();

    if (brandInsertError) {
        console.error('Error creating brand:', brandInsertError);
        return;
    }

    console.log(`   ✓ Created brand: ${newBrand.id}`);

    // 5. Create brand_drafts
    console.log('\n5. Creating brand draft...');

    const { error: draftError } = await newClient
        .from('brand_drafts')
        .insert({
            brand_id: newBrand.id,
            content: oldBrand.draft || { sections: [] },
            version: 1
        });

    if (draftError) {
        console.error('Error creating draft:', draftError);
    } else {
        console.log('   ✓ Created brand draft');
    }

    // 6. Create brand_published (if exists)
    if (oldBrand.published && Object.keys(oldBrand.published).length > 0) {
        console.log('\n6. Creating published version...');

        const { error: publishError } = await newClient
            .from('brand_published')
            .insert({
                brand_id: newBrand.id,
                content: oldBrand.published,
                version: 1,
                published_by: targetUser.id
            });

        if (publishError) {
            console.error('Error creating published:', publishError);
        } else {
            console.log('   ✓ Created published version');
        }
    }

    // 7. Import assets
    if (assets && assets.length > 0) {
        console.log(`\n7. Importing ${assets.length} assets...`);

        let successCount = 0;
        for (const asset of assets) {
            const { error: assetError } = await newClient
                .from('assets')
                .insert({
                    workspace_id: workspaceId,
                    brand_id: newBrand.id,
                    name: asset.name,
                    file_path: asset.file_url || asset.file_path || '',
                    file_type: asset.file_type,
                    file_size: asset.file_size,
                    mime_type: asset.file_type,
                    uploaded_by: targetUser.id
                });

            if (!assetError) successCount++;
        }

        console.log(`   ✓ Imported ${successCount}/${assets.length} assets`);
    }

    console.log('\n=== MIGRATION COMPLETE ===');
    console.log(`Brand ID: ${newBrand.id}`);
    console.log(`Workspace ID: ${workspaceId}`);
    console.log(`User: ${TARGET_EMAIL}`);
}

run().catch(console.error);
