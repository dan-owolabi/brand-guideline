-- ============================================
-- Migration 002: Add folder support columns to assets
-- React/Vite project - Supabase project: vggbfpiknefwtccdhsvr
-- Safe to run multiple times (idempotent)
-- Run this if you get "File upload failed / parent_id column" errors
-- ============================================

-- Add collection_id column if missing
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;

-- Add parent_id for nested folder support
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS parent_id UUID;

-- Add foreign key constraint for parent_id (only if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'assets_parent_id_fkey'
      AND conrelid = 'assets'::regclass
  ) THEN
    ALTER TABLE assets
      ADD CONSTRAINT assets_parent_id_fkey
      FOREIGN KEY (parent_id) REFERENCES assets(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add is_folder flag
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS is_folder BOOLEAN DEFAULT false;

-- Add order column for collections table (used for section reordering)
ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS assets_parent_id_idx ON assets(parent_id);
CREATE INDEX IF NOT EXISTS assets_collection_id_idx ON assets(collection_id);
CREATE INDEX IF NOT EXISTS collections_brand_id_idx ON collections(brand_id);
