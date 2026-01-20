-- TARGETED DATA REPAIR FOR owolabidaniel30@gmail.com
-- Goal: Force-link all orphaned brands to this specific user's new workspace.

DO $$
DECLARE
    v_start_time TIMESTAMP := clock_timestamp();
    v_user_email TEXT := 'owolabidaniel30@gmail.com';
    v_user_id UUID;
    v_workspace_id UUID;
    v_updated_count INT;
BEGIN
    RAISE NOTICE '=== STARTING TARGETED FIX ===';

    ---------------------------------------------------------------------------
    -- 1. IDENTIFY USER
    ---------------------------------------------------------------------------
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User % not found! Cannot proceed.', v_user_email;
    END IF;

    RAISE NOTICE '1. Found User ID: %', v_user_id;

    ---------------------------------------------------------------------------
    -- 2. CREATE WORKSPACE "Nobora"
    ---------------------------------------------------------------------------
    -- Check if it already exists for this user to avoid duplicates
    SELECT id INTO v_workspace_id 
    FROM workspaces 
    WHERE owner_id = v_user_id AND name = 'Nobora' 
    LIMIT 1;

    IF v_workspace_id IS NULL THEN
        INSERT INTO workspaces (name, slug, owner_id)
        VALUES (
            'Nobora', 
            'nobora-' || floor(extract(epoch from now())), -- Ensure unique slug
            v_user_id
        )
        RETURNING id INTO v_workspace_id;
        RAISE NOTICE '2. Created New Workspace "Nobora": %', v_workspace_id;
    ELSE
        RAISE NOTICE '2. Found Existing Workspace "Nobora": %', v_workspace_id;
    END IF;

    ---------------------------------------------------------------------------
    -- 3. ADD WORKSPACE MEMBER
    ---------------------------------------------------------------------------
    INSERT INTO workspace_members (workspace_id, user_id, role, can_invite, brand_access_type)
    VALUES (v_workspace_id, v_user_id, 'owner', true, 'all')
    ON CONFLICT (workspace_id, user_id) 
    DO UPDATE SET role = 'owner'; -- Ensure ownership

    RAISE NOTICE '3. Verified Workspace Membership for User.';

    ---------------------------------------------------------------------------
    -- 4. ATTACH ALL ORPHANED BRANDS
    ---------------------------------------------------------------------------
    WITH updated_rows AS (
        UPDATE brands 
        SET workspace_id = v_workspace_id 
        WHERE workspace_id IS NULL
        RETURNING id
    )
    SELECT COUNT(*) INTO v_updated_count FROM updated_rows;

    RAISE NOTICE '4. Attached % orphaned brands to Workspace %', v_updated_count, v_workspace_id;

    ---------------------------------------------------------------------------
    -- 5. VERIFY
    ---------------------------------------------------------------------------
    -- Just counting for verification log
    DECLARE
        v_final_count INT;
    BEGIN
        SELECT COUNT(*) INTO v_final_count
        FROM brands b
        JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
        WHERE wm.user_id = v_user_id;

        RAISE NOTICE '5. VERIFICATION: User now has access to % brands total.', v_final_count;
    END;

    RAISE NOTICE '=== FIX COMPLETED SUCCESSFULLY ===';

END $$;
