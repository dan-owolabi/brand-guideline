-- ============================================
-- FIX: RLS Infinite Recursion
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Disable RLS temporarily
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE brand_drafts DISABLE ROW LEVEL SECURITY;
ALTER TABLE brand_published DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- STEP 3: Re-enable RLS
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_published ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create simple, non-recursive policies

-- WORKSPACE_MEMBERS: User can only see/edit their own memberships
CREATE POLICY "wm_select" ON workspace_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "wm_insert" ON workspace_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "wm_delete" ON workspace_members FOR DELETE USING (user_id = auth.uid());

-- WORKSPACES: Owner or member can see
CREATE POLICY "ws_select" ON workspaces FOR SELECT 
    USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = id AND wm.user_id = auth.uid()));
CREATE POLICY "ws_insert" ON workspaces FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "ws_update" ON workspaces FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "ws_delete" ON workspaces FOR DELETE USING (owner_id = auth.uid());

-- BRANDS: Member of workspace can access
CREATE POLICY "b_select" ON brands FOR SELECT 
    USING (EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = brands.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "b_insert" ON brands FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = brands.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "b_update" ON brands FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = brands.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "b_delete" ON brands FOR DELETE 
    USING (EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = brands.workspace_id AND wm.user_id = auth.uid()));

-- BRAND_DRAFTS: Access through brand
CREATE POLICY "bd_all" ON brand_drafts FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM brands b 
        JOIN workspace_members wm ON wm.workspace_id = b.workspace_id 
        WHERE b.id = brand_drafts.brand_id AND wm.user_id = auth.uid()
    ));

-- BRAND_PUBLISHED: Public read, member write
CREATE POLICY "bp_select" ON brand_published FOR SELECT USING (true);
CREATE POLICY "bp_write" ON brand_published FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM brands b 
        JOIN workspace_members wm ON wm.workspace_id = b.workspace_id 
        WHERE b.id = brand_published.brand_id AND wm.user_id = auth.uid()
    ));
CREATE POLICY "bp_update" ON brand_published FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM brands b 
        JOIN workspace_members wm ON wm.workspace_id = b.workspace_id 
        WHERE b.id = brand_published.brand_id AND wm.user_id = auth.uid()
    ));
CREATE POLICY "bp_delete" ON brand_published FOR DELETE 
    USING (EXISTS (
        SELECT 1 FROM brands b 
        JOIN workspace_members wm ON wm.workspace_id = b.workspace_id 
        WHERE b.id = brand_published.brand_id AND wm.user_id = auth.uid()
    ));

-- ASSETS: Member of workspace
CREATE POLICY "a_all" ON assets FOR ALL 
    USING (EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = assets.workspace_id AND wm.user_id = auth.uid()));

-- ============================================
-- DONE! Try creating a brand now
-- ============================================
