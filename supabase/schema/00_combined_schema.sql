-- ============================================
-- COMBINED SCHEMA - Run all at once on new Supabase project
-- ============================================
-- This file combines all schema files in order.
-- Run this in Supabase SQL Editor for initial setup.
-- ============================================


-- ============================================
-- 001: WORKSPACES & MEMBERS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
    can_invite BOOLEAN DEFAULT FALSE,
    brand_access_type TEXT DEFAULT 'all' CHECK (brand_access_type IN ('all', 'specific')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON workspaces(slug);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();


-- ============================================
-- 002: BRANDS
-- ============================================

CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    primary_color TEXT DEFAULT '#0066FF',
    font_family TEXT DEFAULT 'Geist',
    custom_font_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, slug)
);

CREATE INDEX idx_brands_workspace ON brands(workspace_id);
CREATE INDEX idx_brands_slug ON brands(slug);

CREATE TRIGGER brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();


-- ============================================
-- 003: DRAFTS & PUBLISHED
-- ============================================

CREATE TABLE brand_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    content JSONB NOT NULL DEFAULT '{"sections": []}',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(brand_id)
);

CREATE TABLE brand_published (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    published_by UUID REFERENCES auth.users(id),
    UNIQUE(brand_id)
);

CREATE INDEX idx_brand_drafts_brand ON brand_drafts(brand_id);
CREATE INDEX idx_brand_published_brand ON brand_published(brand_id);

CREATE TRIGGER brand_drafts_updated_at
    BEFORE UPDATE ON brand_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();


-- ============================================
-- 004: ASSETS
-- ============================================

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_workspace ON assets(workspace_id);
CREATE INDEX idx_assets_brand ON assets(brand_id);
CREATE INDEX idx_assets_type ON assets(file_type);


-- ============================================
-- 005: RLS POLICIES
-- ============================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_published ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Workspaces
CREATE POLICY "Users can view their workspaces"
    ON workspaces FOR SELECT
    USING (id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create workspaces"
    ON workspaces FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update workspaces"
    ON workspaces FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete workspaces"
    ON workspaces FOR DELETE
    USING (owner_id = auth.uid());

-- Workspace Members
CREATE POLICY "Users can view workspace members"
    ON workspace_members FOR SELECT
    USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own memberships"
    ON workspace_members FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Authorized users can add members"
    ON workspace_members FOR INSERT
    WITH CHECK (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND (role = 'owner' OR can_invite = true))
        OR user_id = auth.uid()
    );

CREATE POLICY "Owners can remove members"
    ON workspace_members FOR DELETE
    USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'owner'));

-- Brands
CREATE POLICY "Users can view workspace brands"
    ON brands FOR SELECT
    USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Editors can create brands"
    ON brands FOR INSERT
    WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

CREATE POLICY "Editors can update brands"
    ON brands FOR UPDATE
    USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

CREATE POLICY "Owners can delete brands"
    ON brands FOR DELETE
    USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'owner'));

-- Brand Drafts
CREATE POLICY "Users can view brand drafts"
    ON brand_drafts FOR SELECT
    USING (brand_id IN (SELECT b.id FROM brands b JOIN workspace_members wm ON b.workspace_id = wm.workspace_id WHERE wm.user_id = auth.uid()));

CREATE POLICY "Editors can create drafts"
    ON brand_drafts FOR INSERT
    WITH CHECK (brand_id IN (SELECT b.id FROM brands b JOIN workspace_members wm ON b.workspace_id = wm.workspace_id WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'editor')));

CREATE POLICY "Editors can update drafts"
    ON brand_drafts FOR UPDATE
    USING (brand_id IN (SELECT b.id FROM brands b JOIN workspace_members wm ON b.workspace_id = wm.workspace_id WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'editor')));

CREATE POLICY "Owners can delete drafts"
    ON brand_drafts FOR DELETE
    USING (brand_id IN (SELECT b.id FROM brands b JOIN workspace_members wm ON b.workspace_id = wm.workspace_id WHERE wm.user_id = auth.uid() AND wm.role = 'owner'));

-- Brand Published (public read)
CREATE POLICY "Public can view published brands"
    ON brand_published FOR SELECT
    USING (true);

CREATE POLICY "Editors can publish brands"
    ON brand_published FOR INSERT
    WITH CHECK (brand_id IN (SELECT b.id FROM brands b JOIN workspace_members wm ON b.workspace_id = wm.workspace_id WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'editor')));

CREATE POLICY "Editors can update published brands"
    ON brand_published FOR UPDATE
    USING (brand_id IN (SELECT b.id FROM brands b JOIN workspace_members wm ON b.workspace_id = wm.workspace_id WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'editor')));

CREATE POLICY "Owners can unpublish brands"
    ON brand_published FOR DELETE
    USING (brand_id IN (SELECT b.id FROM brands b JOIN workspace_members wm ON b.workspace_id = wm.workspace_id WHERE wm.user_id = auth.uid() AND wm.role = 'owner'));

-- Assets
CREATE POLICY "Users can view workspace assets"
    ON assets FOR SELECT
    USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Editors can upload assets"
    ON assets FOR INSERT
    WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

CREATE POLICY "Editors can update assets"
    ON assets FOR UPDATE
    USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

CREATE POLICY "Owners can delete assets"
    ON assets FOR DELETE
    USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'owner'));


-- ============================================
-- 006: FUNCTIONS
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

CREATE OR REPLACE FUNCTION create_workspace_with_owner(p_name TEXT, p_slug TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_workspace_id UUID;
BEGIN
    INSERT INTO workspaces (name, slug, owner_id)
    VALUES (p_name, p_slug, auth.uid())
    RETURNING id INTO v_workspace_id;
    
    INSERT INTO workspace_members (workspace_id, user_id, role, can_invite)
    VALUES (v_workspace_id, auth.uid(), 'owner', true);
    
    RETURN v_workspace_id;
END;
$$;

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
    SELECT workspace_id INTO v_workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    IF v_workspace_id IS NOT NULL THEN
        RETURN v_workspace_id;
    END IF;
    
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    v_workspace_id := create_workspace_with_owner(
        COALESCE(SPLIT_PART(v_user_email, '@', 1), 'My') || '''s Workspace',
        LOWER(REGEXP_REPLACE(COALESCE(SPLIT_PART(v_user_email, '@', 1), 'workspace'), '[^a-z0-9]', '-', 'g')) || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8)
    );
    
    RETURN v_workspace_id;
END;
$$;


-- ============================================
-- 007: STORAGE
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view brand assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'brand-assets');

CREATE POLICY "Authenticated users can upload assets"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'brand-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own assets"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own assets"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ============================================
-- SETUP COMPLETE!
-- ============================================
