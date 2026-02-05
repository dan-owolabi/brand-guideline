-- ============================================
-- 005_rls_policies.sql
-- Row Level Security policies for all tables
-- ============================================

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_published ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- WORKSPACES POLICIES
-- ============================================

-- Users can view workspaces they are members of
CREATE POLICY "Users can view their workspaces"
    ON workspaces FOR SELECT
    USING (
        id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Users can create workspaces (they become owner)
CREATE POLICY "Users can create workspaces"
    ON workspaces FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Only owners can update their workspaces
CREATE POLICY "Owners can update workspaces"
    ON workspaces FOR UPDATE
    USING (owner_id = auth.uid());

-- Only owners can delete their workspaces
CREATE POLICY "Owners can delete workspaces"
    ON workspaces FOR DELETE
    USING (owner_id = auth.uid());

-- ============================================
-- WORKSPACE_MEMBERS POLICIES
-- ============================================

-- Users can view members of their workspaces
CREATE POLICY "Users can view workspace members"
    ON workspace_members FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Users can view their own memberships
CREATE POLICY "Users can view own memberships"
    ON workspace_members FOR SELECT
    USING (user_id = auth.uid());

-- Owners and invited users can add members
CREATE POLICY "Authorized users can add members"
    ON workspace_members FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() 
            AND (role = 'owner' OR can_invite = true)
        )
        OR user_id = auth.uid() -- Users can be added to workspaces
    );

-- Owners can remove members
CREATE POLICY "Owners can remove members"
    ON workspace_members FOR DELETE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- ============================================
-- BRANDS POLICIES
-- ============================================

-- Users can view brands in their workspaces
CREATE POLICY "Users can view workspace brands"
    ON brands FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Editors and owners can create brands
CREATE POLICY "Editors can create brands"
    ON brands FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- Editors and owners can update brands
CREATE POLICY "Editors can update brands"
    ON brands FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- Only owners can delete brands
CREATE POLICY "Owners can delete brands"
    ON brands FOR DELETE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- ============================================
-- BRAND_DRAFTS POLICIES
-- ============================================

-- Users can view drafts for brands they have access to
CREATE POLICY "Users can view brand drafts"
    ON brand_drafts FOR SELECT
    USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

-- Editors can create/update drafts
CREATE POLICY "Editors can create drafts"
    ON brand_drafts FOR INSERT
    WITH CHECK (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'editor')
        )
    );

CREATE POLICY "Editors can update drafts"
    ON brand_drafts FOR UPDATE
    USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'editor')
        )
    );

CREATE POLICY "Owners can delete drafts"
    ON brand_drafts FOR DELETE
    USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND wm.role = 'owner'
        )
    );

-- ============================================
-- BRAND_PUBLISHED POLICIES
-- ============================================

-- Anyone can view published brands (public)
CREATE POLICY "Public can view published brands"
    ON brand_published FOR SELECT
    USING (true);

-- Editors can publish
CREATE POLICY "Editors can publish brands"
    ON brand_published FOR INSERT
    WITH CHECK (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'editor')
        )
    );

CREATE POLICY "Editors can update published brands"
    ON brand_published FOR UPDATE
    USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'editor')
        )
    );

CREATE POLICY "Owners can unpublish brands"
    ON brand_published FOR DELETE
    USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND wm.role = 'owner'
        )
    );

-- ============================================
-- ASSETS POLICIES
-- ============================================

-- Users can view assets in their workspaces
CREATE POLICY "Users can view workspace assets"
    ON assets FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Editors can upload assets
CREATE POLICY "Editors can upload assets"
    ON assets FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- Editors can update asset metadata
CREATE POLICY "Editors can update assets"
    ON assets FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- Owners can delete assets
CREATE POLICY "Owners can delete assets"
    ON assets FOR DELETE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );
