-- ============================================
-- 002_brands.sql
-- Brands table with workspace relationship
-- ============================================

-- Brands table
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
    
    -- Each brand slug must be unique within a workspace
    UNIQUE(workspace_id, slug)
);

-- Indexes
CREATE INDEX idx_brands_workspace ON brands(workspace_id);
CREATE INDEX idx_brands_slug ON brands(slug);

-- Updated trigger
CREATE TRIGGER brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
