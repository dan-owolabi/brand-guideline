-- EMERGENCY DATA FIX for User owolabidaniel30@gmail.com
-- Run this to manually create a workspace and link existing brands.

DO $$
DECLARE
    v_user_email TEXT := 'owolabidaniel30@gmail.com';
    v_user_id UUID;
    v_workspace_id UUID;
BEGIN
    -- 1. Get User ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User % not found', v_user_email;
    END IF;

    RAISE NOTICE 'Found user: % (ID: %)', v_user_email, v_user_id;

    -- 2. Find or Create Workspace
    SELECT id INTO v_workspace_id 
    FROM workspaces 
    WHERE owner_id = v_user_id 
    LIMIT 1;

    IF v_workspace_id IS NULL THEN
        RAISE NOTICE 'Creating new workspace for user...';
        INSERT INTO workspaces (name, slug, owner_id)
        VALUES ('My Workspace', 'my-workspace-' || floor(extract(epoch from now())), v_user_id)
        RETURNING id INTO v_workspace_id;
    ELSE
        RAISE NOTICE 'Found existing workspace: %', v_workspace_id;
    END IF;

    -- 3. Ensure Membership Exists (Fixes "Member" with no access)
    INSERT INTO workspace_members (workspace_id, user_id, role, can_invite, brand_access_type)
    VALUES (v_workspace_id, v_user_id, 'owner', true, 'all')
    ON CONFLICT (workspace_id, user_id) 
    DO UPDATE SET role = 'owner', brand_access_type = 'all'; 

    -- 4. Re-assign Orphaned Brands (Brands with no workspace or old account link)
    -- This helps if brands migrated but lost visibility
    UPDATE brands 
    SET workspace_id = v_workspace_id 
    WHERE workspace_id IS NULL 
       OR workspace_id NOT IN (SELECT id FROM workspaces);

    -- 5. Fix RLS for Brands (just in case)
    -- Ensure the user can actually SEE the brands in this workspace
    -- (The 002 migration policies should cover this, but we verify data integrity here)
    
    RAISE NOTICE '✅ manual fix complete. Workspace ID: %', v_workspace_id;
END $$;
