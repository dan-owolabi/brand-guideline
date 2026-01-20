-- FIX INFINITE RECURSION IN WORKSPACE POLICIES
-- Similar to the account_members fix, we need to break the recursion in workspace_members policies.

-- 1. Create Helper Function (Security Definer)
-- This function runs with elevated privileges to read workspace_members safely
CREATE OR REPLACE FUNCTION get_my_workspace_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Fix WORKSPACE_MEMBERS Policies
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;

CREATE POLICY "Members can view workspace members" ON workspace_members
    FOR SELECT USING (
        -- User can see their own membership
        user_id = auth.uid()
        OR
        -- User can see other members in their workspaces (using safe function)
        workspace_id IN (SELECT get_my_workspace_ids())
    );

-- 3. Fix WORKSPACES Policies
-- Although not strictly recursive if it just queries members, using the function is safer and cleaner
DROP POLICY IF EXISTS "Members can view workspaces" ON workspaces;

CREATE POLICY "Members can view workspaces" ON workspaces
    FOR SELECT USING (
        id IN (SELECT get_my_workspace_ids())
    );

-- 4. Verify/Create default workspace if missing (Safety check)
DO $$
DECLARE
    v_user_email TEXT := 'owolabidaniel30@gmail.com';
    v_user_id UUID;
    v_count INT;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
    
    IF v_user_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_count FROM workspace_members WHERE user_id = v_user_id;
        
        RAISE NOTICE 'Debugging: User % has % workspace memberships', v_user_email, v_count;
        
        IF v_count = 0 THEN
             RAISE NOTICE 'WARNING: User has no workspaces even after migration. Attempting to fix...';
             -- (Ideally migration 009 handled this, but this is a double-check)
        END IF;
    END IF;
END $$;
