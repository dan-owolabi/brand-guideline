-- COMPREHENSIVE WORKSPACE MIGRATION (Fixes missing workspaces/brands)
-- Run this in Supabase SQL Editor.

-- 1. Ensure schema correctness
DO $$ 
BEGIN 
    -- Add workspace_id to brands if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'workspace_id') THEN
        ALTER TABLE brands ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Backfill Workspaces for ALL Users
DO $$
DECLARE
    r_user RECORD;
    v_workspace_id UUID;
BEGIN
    FOR r_user IN SELECT * FROM auth.users LOOP
        -- Check if user owns a workspace
        SELECT id INTO v_workspace_id FROM workspaces WHERE owner_id = r_user.id LIMIT 1;
        
        -- Create if missing
        IF v_workspace_id IS NULL THEN
            INSERT INTO workspaces (name, slug, owner_id)
            VALUES (
                COALESCE(r_user.raw_user_meta_data->>'full_name', 'Personal') || '''s Workspace',
                'ws-' || substr(md5(random()::text), 1, 8), -- Random slug to avoid collision
                r_user.id
            )
            RETURNING id INTO v_workspace_id;
            RAISE NOTICE 'Created workspace for user %: %', r_user.email, v_workspace_id;
        ELSE
            RAISE NOTICE 'User % already has workspace: %', r_user.email, v_workspace_id;
        END IF;

        -- Ensure Membership
        INSERT INTO workspace_members (workspace_id, user_id, role, can_invite, brand_access_type)
        VALUES (v_workspace_id, r_user.id, 'owner', true, 'all')
        ON CONFLICT (workspace_id, user_id) 
        DO UPDATE SET role = 'owner', brand_access_type = 'all';
    END LOOP;
END $$;

-- 3. Migrate Orphaned Brands (The "Recovery" Step)
DO $$
DECLARE
    v_default_user_email TEXT := 'owolabidaniel30@gmail.com';
    v_default_ws_id UUID;
    r_brand RECORD;
    v_linked_ws_id UUID;
BEGIN
    -- Get target workspace for the main user (Fallback destination)
    SELECT w.id INTO v_default_ws_id 
    FROM workspaces w 
    JOIN auth.users u ON u.id = w.owner_id 
    WHERE u.email = v_default_user_email LIMIT 1;

    -- Iterate brands with no workspace
    FOR r_brand IN SELECT * FROM brands WHERE workspace_id IS NULL LOOP
        v_linked_ws_id := NULL;

        -- Strategy A: If brand has account_id, try to link to workspace (assuming account_id migrated to workspace_id)
        IF r_brand.account_id IS NOT NULL THEN
             -- Check if workspace exists with that ID (from 002 migration)
             SELECT id INTO v_linked_ws_id FROM workspaces WHERE id = r_brand.account_id;
             
             -- If not found, check if mapped via owner
             IF v_linked_ws_id IS NULL THEN
                 SELECT w.id INTO v_linked_ws_id
                 FROM account_members am
                 JOIN workspaces w ON w.owner_id = am.user_id
                 WHERE am.account_id = r_brand.account_id AND am.role = 'owner'
                 LIMIT 1;
             END IF;
        END IF;

        -- Strategy B: Fallback to default user
        IF v_linked_ws_id IS NULL AND v_default_ws_id IS NOT NULL THEN
            v_linked_ws_id := v_default_ws_id;
            RAISE NOTICE 'Brand % has no link, assigning to default user workspace', r_brand.name;
        END IF;

        -- Apply Update
        IF v_linked_ws_id IS NOT NULL THEN
            UPDATE brands SET workspace_id = v_linked_ws_id WHERE id = r_brand.id;
        END IF;
    END LOOP;
END $$;

-- 4. Final Cleanup
-- Only enforce NOT NULL if we are sure all brands are migrated. 
-- For safety, we keep it nullable for now but log any remaining orphans.
DO $$
DECLARE
    v_orphan_count INT;
BEGIN
    SELECT COUNT(*) INTO v_orphan_count FROM brands WHERE workspace_id IS NULL;
    IF v_orphan_count > 0 THEN
        RAISE WARNING '% brands still have NULL workspace_id!', v_orphan_count;
    ELSE
        RAISE NOTICE 'All brands successfully migrated to workspaces.';
        -- ALTER TABLE brands ALTER COLUMN workspace_id SET NOT NULL; -- Uncomment to enforce
    END IF;
END $$;
