-- EMERGENCY FIX: Ensure user has workspace membership
-- Run this in Supabase SQL Editor

-- 1. First, check if user has any workspace memberships
DO $$
DECLARE
    v_user_id UUID;
    v_workspace_id UUID;
    v_count INT;
BEGIN
    -- Get the user ID for your email
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'owolabidaniel30@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found. Check the email address.';
    END IF;
    
    RAISE NOTICE 'Found user: %', v_user_id;
    
    -- Check existing workspace memberships
    SELECT COUNT(*) INTO v_count FROM workspace_members WHERE user_id = v_user_id;
    RAISE NOTICE 'Existing workspace memberships: %', v_count;
    
    -- Check for any workspaces owned by this user
    SELECT id INTO v_workspace_id FROM workspaces WHERE owner_id = v_user_id LIMIT 1;
    
    IF v_workspace_id IS NOT NULL THEN
        RAISE NOTICE 'User owns workspace: %', v_workspace_id;
        
        -- Ensure membership exists
        INSERT INTO workspace_members (workspace_id, user_id, role, can_invite, brand_access_type)
        VALUES (v_workspace_id, v_user_id, 'owner', true, 'all')
        ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = 'owner';
        
        RAISE NOTICE 'Ensured owner membership exists';
    ELSE
        RAISE NOTICE 'User has no workspace. Creating one...';
        
        -- Create a default workspace
        INSERT INTO workspaces (name, slug, owner_id)
        VALUES ('My Workspace', 'my-workspace-' || substr(v_user_id::text, 1, 8), v_user_id)
        RETURNING id INTO v_workspace_id;
        
        RAISE NOTICE 'Created workspace: %', v_workspace_id;
        
        -- Create membership
        INSERT INTO workspace_members (workspace_id, user_id, role, can_invite, brand_access_type)
        VALUES (v_workspace_id, v_user_id, 'owner', true, 'all');
        
        -- Move any orphaned brands to this workspace
        UPDATE brands SET workspace_id = v_workspace_id 
        WHERE workspace_id IS NULL AND account_id IN (
            SELECT account_id FROM account_members WHERE user_id = v_user_id
        );
        
        RAISE NOTICE 'Migration complete!';
    END IF;
END $$;

-- 2. Verify the fix
SELECT 
    w.id as workspace_id,
    w.name as workspace_name,
    wm.role,
    (SELECT COUNT(*) FROM brands WHERE workspace_id = w.id) as brand_count
FROM workspaces w
JOIN workspace_members wm ON w.id = wm.workspace_id
JOIN auth.users u ON wm.user_id = u.id
WHERE u.email = 'owolabidaniel30@gmail.com';
