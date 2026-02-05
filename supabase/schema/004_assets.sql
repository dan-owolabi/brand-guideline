-- ============================================
-- 004_assets.sql
-- File/image asset storage metadata
-- ============================================

-- Assets table (metadata for uploaded files)
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

-- Indexes
CREATE INDEX idx_assets_workspace ON assets(workspace_id);
CREATE INDEX idx_assets_brand ON assets(brand_id);
CREATE INDEX idx_assets_type ON assets(file_type);
