-- ============================================
-- 006_functions.sql
-- Helper functions for the application
-- ============================================

-- ============================================
-- GET USER WORKSPACES (for AuthContext)
-- ============================================
CREATE OR REPLACE FUNCTION get_user_workspaces()
RETURNS TABLE (
    workspace_id UUID,
    workspace_name TEXT,
    workspace_slug TEXT,
    workspace_logo_url TEXT,
    role TEXT,
    can_invite BOOLEAN,
    brand_access_type TEXT,
    is_owner BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id AS workspace_id,
        w.name AS workspace_name,
        w.slug AS workspace_slug,
        w.logo_url AS workspace_logo_url,
        wm.role,
        wm.can_invite,
        wm.brand_access_type,
        (w.owner_id = auth.uid()) AS is_owner
    FROM workspace_members wm
    JOIN workspaces w ON w.id = wm.workspace_id
    WHERE wm.user_id = auth.uid();
END;
$$;

-- ============================================
-- CREATE WORKSPACE WITH OWNER MEMBERSHIP
-- ============================================
CREATE OR REPLACE FUNCTION create_workspace_with_owner(
    p_name TEXT,
    p_slug TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_workspace_id UUID;
BEGIN
    -- Create the workspace
    INSERT INTO workspaces (name, slug, owner_id)
    VALUES (p_name, p_slug, auth.uid())
    RETURNING id INTO v_workspace_id;
    
    -- Add owner as a member
    INSERT INTO workspace_members (workspace_id, user_id, role, can_invite)
    VALUES (v_workspace_id, auth.uid(), 'owner', true);
    
    RETURN v_workspace_id;
END;
$$;

-- ============================================
-- ENSURE USER HAS DEFAULT WORKSPACE
-- Called on login to create workspace if none exists
-- ============================================
CREATE OR REPLACE FUNCTION ensure_user_workspace()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_workspace_id UUID;
    v_user_email TEXT;
BEGIN
    -- Check if user already has a workspace
    SELECT workspace_id INTO v_workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    IF v_workspace_id IS NOT NULL THEN
        RETURN v_workspace_id;
    END IF;
    
    -- Get user email for workspace name
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    -- Create a default workspace
    v_workspace_id := create_workspace_with_owner(
        COALESCE(SPLIT_PART(v_user_email, '@', 1), 'My') || '''s Workspace',
        LOWER(REGEXP_REPLACE(COALESCE(SPLIT_PART(v_user_email, '@', 1), 'workspace'), '[^a-z0-9]', '-', 'g')) || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8)
    );
    
    RETURN v_workspace_id;
END;
$$;

-- ============================================
-- GET WORKSPACE BRANDS COUNT
-- ============================================
CREATE OR REPLACE FUNCTION get_workspace_brand_count(p_workspace_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM brands
        WHERE workspace_id = p_workspace_id
    );
END;
$$;
