-- Migration 005: Drop brands.workspace_id FK constraint
-- The app uses account_id (references accounts) for brand ownership.
-- workspace_id was from the original schema and is no longer used.

ALTER TABLE brands
    DROP CONSTRAINT IF EXISTS brands_workspace_id_fkey;

ALTER TABLE brands
    ALTER COLUMN workspace_id DROP NOT NULL;
