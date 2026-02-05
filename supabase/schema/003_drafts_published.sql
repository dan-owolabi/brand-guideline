-- ============================================
-- 003_drafts_published.sql
-- Draft and published content tables
-- ============================================

-- Brand drafts (working copy)
CREATE TABLE brand_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    content JSONB NOT NULL DEFAULT '{"sections": []}',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One draft per brand
    UNIQUE(brand_id)
);

-- Brand published versions (snapshots)
CREATE TABLE brand_published (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    published_by UUID REFERENCES auth.users(id),
    
    -- One published version per brand (latest only)
    UNIQUE(brand_id)
);

-- Indexes
CREATE INDEX idx_brand_drafts_brand ON brand_drafts(brand_id);
CREATE INDEX idx_brand_published_brand ON brand_published(brand_id);

-- Updated trigger for drafts
CREATE TRIGGER brand_drafts_updated_at
    BEFORE UPDATE ON brand_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
