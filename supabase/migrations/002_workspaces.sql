-- ============================================
-- WORKSPACE & PERMISSIONS SYSTEM MIGRATION
-- ============================================

-- 1. CREATE NEW TABLES
-- ============================================

-- Workspaces (replaces accounts concept)
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace members with roles
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    can_invite BOOLEAN DEFAULT FALSE,
    brand_access_type TEXT DEFAULT 'specific' CHECK (brand_access_type IN ('all', 'specific')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Brand-level permissions per member
CREATE TABLE IF NOT EXISTS brand_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_member_id UUID NOT NULL REFERENCES workspace_members(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('none', 'view', 'edit')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_member_id, brand_id)
);

-- Pending invitations
CREATE TABLE IF NOT EXISTS workspace_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
    can_invite BOOLEAN DEFAULT FALSE,
    brand_access_type TEXT DEFAULT 'specific',
    brand_ids UUID[] DEFAULT '{}',
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ADD workspace_id TO BRANDS
-- ============================================
ALTER TABLE brands ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- 3. MIGRATE EXISTING DATA
-- ============================================
DO $$
DECLARE
    acc RECORD;
    new_workspace_id UUID;
    member_rec RECORD;
    brand_rec RECORD;
BEGIN
    -- For each existing account, create a workspace
    FOR acc IN SELECT * FROM accounts LOOP
        -- Create workspace with first owner as the owner
        SELECT user_id INTO member_rec FROM account_members WHERE account_id = acc.id AND role = 'owner' LIMIT 1;
        
        IF member_rec.user_id IS NOT NULL THEN
            INSERT INTO workspaces (id, name, slug, owner_id, logo_url, created_at)
            VALUES (acc.id, acc.name, acc.slug, member_rec.user_id, acc.logo_url, acc.created_at)
            ON CONFLICT (id) DO NOTHING
            RETURNING id INTO new_workspace_id;
            
            IF new_workspace_id IS NULL THEN
                new_workspace_id := acc.id;
            END IF;
            
            -- Migrate account_members to workspace_members
            FOR member_rec IN SELECT * FROM account_members WHERE account_id = acc.id LOOP
                INSERT INTO workspace_members (workspace_id, user_id, role, can_invite, brand_access_type)
                VALUES (new_workspace_id, member_rec.user_id, member_rec.role, member_rec.role = 'owner', 'all')
                ON CONFLICT (workspace_id, user_id) DO NOTHING;
            END LOOP;
            
            -- Update brands to use workspace_id
            UPDATE brands SET workspace_id = new_workspace_id WHERE account_id = acc.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration complete!';
END $$;

-- 4. ENABLE RLS
-- ============================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR WORKSPACES
-- ============================================

-- Users can view workspaces they are members of
CREATE POLICY "Members can view workspaces" ON workspaces
    FOR SELECT USING (
        id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );

-- Any authenticated user can create a workspace
CREATE POLICY "Users can create workspaces" ON workspaces
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- Only owners can update their workspace
CREATE POLICY "Owners can update workspaces" ON workspaces
    FOR UPDATE USING (owner_id = auth.uid());

-- Only owners can delete their workspace
CREATE POLICY "Owners can delete workspaces" ON workspaces
    FOR DELETE USING (owner_id = auth.uid());

-- 6. RLS POLICIES FOR WORKSPACE_MEMBERS
-- ============================================

-- Members can view other members in their workspaces
CREATE POLICY "Members can view workspace members" ON workspace_members
    FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );

-- Owners can add members
CREATE POLICY "Owners can add members" ON workspace_members
    FOR INSERT WITH CHECK (
        workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
        OR (
            workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND can_invite = true)
        )
    );

-- Owners can update member permissions
CREATE POLICY "Owners can update members" ON workspace_members
    FOR UPDATE USING (
        workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
    );

-- Owners can remove members
CREATE POLICY "Owners can remove members" ON workspace_members
    FOR DELETE USING (
        workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
    );

-- 7. RLS POLICIES FOR BRAND_PERMISSIONS
-- ============================================

-- Members can view their own brand permissions
CREATE POLICY "Members can view brand permissions" ON brand_permissions
    FOR SELECT USING (
        workspace_member_id IN (SELECT id FROM workspace_members WHERE user_id = auth.uid())
        OR workspace_member_id IN (
            SELECT wm.id FROM workspace_members wm
            JOIN workspaces w ON w.id = wm.workspace_id
            WHERE w.owner_id = auth.uid()
        )
    );

-- Owners can manage brand permissions
CREATE POLICY "Owners can manage brand permissions" ON brand_permissions
    FOR ALL USING (
        workspace_member_id IN (
            SELECT wm.id FROM workspace_members wm
            JOIN workspaces w ON w.id = wm.workspace_id
            WHERE w.owner_id = auth.uid()
        )
    );

-- 8. RLS POLICIES FOR WORKSPACE_INVITATIONS
-- ============================================

-- Owners and members with invite permission can view invitations
CREATE POLICY "View workspace invitations" ON workspace_invitations
    FOR SELECT USING (
        workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
        OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND can_invite = true)
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Owners and members with invite permission can create invitations
CREATE POLICY "Create workspace invitations" ON workspace_invitations
    FOR INSERT WITH CHECK (
        workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
        OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND can_invite = true)
    );

-- 9. UPDATED BRANDS RLS (use workspace_id)
-- ============================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Members can view account brands" ON brands;
DROP POLICY IF EXISTS "Public can view published brands" ON brands;
DROP POLICY IF EXISTS "Editors can insert brands" ON brands;
DROP POLICY IF EXISTS "Editors can update brands" ON brands;
DROP POLICY IF EXISTS "Editors can delete brands" ON brands;
DROP POLICY IF EXISTS "members_view_brands" ON brands;
DROP POLICY IF EXISTS "public_view_brands" ON brands;
DROP POLICY IF EXISTS "editors_manage_brands" ON brands;
DROP POLICY IF EXISTS "nuclear_brands_select" ON brands;
DROP POLICY IF EXISTS "nuclear_brands_insert" ON brands;
DROP POLICY IF EXISTS "nuclear_brands_update" ON brands;

-- New workspace-based policies
CREATE POLICY "Workspace members can view brands" ON brands
    FOR SELECT USING (
        -- Owners see all brands in their workspaces
        workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
        OR
        -- Members with "all" access type see all brands
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND brand_access_type = 'all'
        )
        OR
        -- Members with specific permissions
        id IN (
            SELECT bp.brand_id FROM brand_permissions bp
            JOIN workspace_members wm ON wm.id = bp.workspace_member_id
            WHERE wm.user_id = auth.uid() AND bp.permission IN ('view', 'edit')
        )
    );

-- Owners and editors with edit permission can create brands
CREATE POLICY "Can create brands" ON brands
    FOR INSERT WITH CHECK (
        workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
        OR workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

-- Owners and editors with edit permission can update brands
CREATE POLICY "Can update brands" ON brands
    FOR UPDATE USING (
        workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
        OR id IN (
            SELECT bp.brand_id FROM brand_permissions bp
            JOIN workspace_members wm ON wm.id = bp.workspace_member_id
            WHERE wm.user_id = auth.uid() AND bp.permission = 'edit'
        )
        OR (
            workspace_id IN (
                SELECT workspace_id FROM workspace_members 
                WHERE user_id = auth.uid() AND role IN ('owner', 'editor') AND brand_access_type = 'all'
            )
        )
    );

-- Owners can delete brands
CREATE POLICY "Owners can delete brands" ON brands
    FOR DELETE USING (
        workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
    );

-- 10. HELPER FUNCTIONS
-- ============================================

-- Get user's workspaces with role
CREATE OR REPLACE FUNCTION get_user_workspaces()
RETURNS TABLE (
    workspace_id UUID,
    workspace_name TEXT,
    workspace_slug TEXT,
    role TEXT,
    is_owner BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.name,
        w.slug,
        wm.role,
        w.owner_id = auth.uid()
    FROM workspaces w
    JOIN workspace_members wm ON w.id = wm.workspace_id
    WHERE wm.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check brand permission for current user
CREATE OR REPLACE FUNCTION check_brand_permission(p_brand_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_workspace_id UUID;
    v_permission TEXT;
BEGIN
    -- Get brand's workspace
    SELECT workspace_id INTO v_workspace_id FROM brands WHERE id = p_brand_id;
    
    -- Check if user is owner
    IF EXISTS (SELECT 1 FROM workspaces WHERE id = v_workspace_id AND owner_id = auth.uid()) THEN
        RETURN 'edit';
    END IF;
    
    -- Check if user has "all" access with editor role
    IF EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_id = v_workspace_id 
        AND user_id = auth.uid() 
        AND brand_access_type = 'all'
        AND role IN ('owner', 'editor')
    ) THEN
        RETURN 'edit';
    END IF;
    
    -- Check if user has "all" access with viewer role
    IF EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_id = v_workspace_id 
        AND user_id = auth.uid() 
        AND brand_access_type = 'all'
        AND role = 'viewer'
    ) THEN
        RETURN 'view';
    END IF;
    
    -- Check specific brand permission
    SELECT bp.permission INTO v_permission
    FROM brand_permissions bp
    JOIN workspace_members wm ON wm.id = bp.workspace_member_id
    WHERE bp.brand_id = p_brand_id AND wm.user_id = auth.uid();
    
    RETURN COALESCE(v_permission, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. TRIGGER: Auto-create workspace owner membership
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_workspace()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO workspace_members (workspace_id, user_id, role, can_invite, brand_access_type)
    VALUES (NEW.id, NEW.owner_id, 'owner', true, 'all');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_workspace_created ON workspaces;
CREATE TRIGGER on_workspace_created
    AFTER INSERT ON workspaces
    FOR EACH ROW EXECUTE FUNCTION handle_new_workspace();

-- SUCCESS
DO $$
BEGIN
    RAISE NOTICE '✅ Workspace & Permissions migration complete!';
END $$;
