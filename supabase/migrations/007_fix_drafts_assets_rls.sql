-- ============================================
-- Migration 007: Fix RLS on assets, collections (and brand_drafts/
-- brand_published if they exist)
--
-- These tables were created via supabase/schema/*.sql (a superseded,
-- workspace-based design) and their RLS policies there check
-- workspace_id / workspace_members. The app moved to accounts /
-- account_members (see migrations 001-006) and brands.workspace_id was
-- dropped in migration 005, so those old policies can never match
-- anything real anymore. This was masked entirely by the client using
-- the service_role key (bypasses RLS) — see the fix that switched
-- src/lib/supabase.js back to the anon key. Under real RLS enforcement
-- these old policies would silently block all assets/collections reads
-- and writes for every user.
--
-- brand_drafts / brand_published may not exist at all in your database
-- (the app actually stores draft/published content as JSONB columns
-- directly on `brands`, already covered by migration 004's brands
-- policies) — every block below is guarded so it's a no-op for
-- whichever of these tables don't exist. Safe to run multiple times.
-- ============================================

-- Make assets.workspace_id nullable if it's still NOT NULL from the old
-- schema — the app never sets it, mirroring what migration 005 did for
-- brands.workspace_id.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'assets' AND column_name = 'workspace_id' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE assets ALTER COLUMN workspace_id DROP NOT NULL;
    END IF;
END $$;

-- Drop every existing policy on these tables, regardless of name, since
-- they may have come from any of several superseded schema files.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname, tablename FROM pg_policies
        WHERE tablename IN ('brand_drafts', 'brand_published', 'assets', 'collections')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- ============================================
-- BRAND_DRAFTS (only if the table exists)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_drafts') THEN
        EXECUTE 'ALTER TABLE brand_drafts ENABLE ROW LEVEL SECURITY';

        EXECUTE $p$
            CREATE POLICY "Members can view brand drafts" ON brand_drafts
                FOR SELECT USING (
                    brand_id IN (SELECT id FROM brands WHERE account_id IN (SELECT get_user_account_ids()))
                )
        $p$;

        EXECUTE $p$
            CREATE POLICY "Editors can write brand drafts" ON brand_drafts
                FOR INSERT WITH CHECK (
                    brand_id IN (
                        SELECT id FROM brands WHERE account_id IN (
                            SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
                        )
                    )
                )
        $p$;

        EXECUTE $p$
            CREATE POLICY "Editors can update brand drafts" ON brand_drafts
                FOR UPDATE USING (
                    brand_id IN (
                        SELECT id FROM brands WHERE account_id IN (
                            SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
                        )
                    )
                )
        $p$;

        EXECUTE $p$
            CREATE POLICY "Editors can delete brand drafts" ON brand_drafts
                FOR DELETE USING (
                    brand_id IN (
                        SELECT id FROM brands WHERE account_id IN (
                            SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
                        )
                    )
                )
        $p$;
    END IF;
END $$;

-- ============================================
-- BRAND_PUBLISHED (only if the table exists; publicly readable, same write rules as drafts)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_published') THEN
        EXECUTE 'ALTER TABLE brand_published ENABLE ROW LEVEL SECURITY';

        EXECUTE $p$
            CREATE POLICY "Public can view published brand content" ON brand_published
                FOR SELECT USING (true)
        $p$;

        EXECUTE $p$
            CREATE POLICY "Editors can write published brand content" ON brand_published
                FOR INSERT WITH CHECK (
                    brand_id IN (
                        SELECT id FROM brands WHERE account_id IN (
                            SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
                        )
                    )
                )
        $p$;

        EXECUTE $p$
            CREATE POLICY "Editors can update published brand content" ON brand_published
                FOR UPDATE USING (
                    brand_id IN (
                        SELECT id FROM brands WHERE account_id IN (
                            SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
                        )
                    )
                )
        $p$;

        EXECUTE $p$
            CREATE POLICY "Editors can delete published brand content" ON brand_published
                FOR DELETE USING (
                    brand_id IN (
                        SELECT id FROM brands WHERE account_id IN (
                            SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
                        )
                    )
                )
        $p$;
    END IF;
END $$;

-- ============================================
-- ASSETS (only if the table exists)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets') THEN
        EXECUTE 'ALTER TABLE assets ENABLE ROW LEVEL SECURITY';

        EXECUTE $p$
            CREATE POLICY "Members can view assets" ON assets
                FOR SELECT USING (
                    brand_id IN (SELECT id FROM brands WHERE account_id IN (SELECT get_user_account_ids()))
                    OR brand_id IN (SELECT id FROM brands WHERE account_id IN (SELECT id FROM accounts WHERE is_published = true))
                )
        $p$;

        EXECUTE $p$
            CREATE POLICY "Editors can upload assets" ON assets
                FOR INSERT WITH CHECK (
                    brand_id IN (
                        SELECT id FROM brands WHERE account_id IN (
                            SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
                        )
                    )
                )
        $p$;

        EXECUTE $p$
            CREATE POLICY "Editors can update assets" ON assets
                FOR UPDATE USING (
                    brand_id IN (
                        SELECT id FROM brands WHERE account_id IN (
                            SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
                        )
                    )
                )
        $p$;

        EXECUTE $p$
            CREATE POLICY "Editors can delete assets" ON assets
                FOR DELETE USING (
                    brand_id IN (
                        SELECT id FROM brands WHERE account_id IN (
                            SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
                        )
                    )
                )
        $p$;
    END IF;
END $$;

-- ============================================
-- COLLECTIONS (only if the table exists)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collections') THEN
        EXECUTE 'ALTER TABLE collections ENABLE ROW LEVEL SECURITY';

        EXECUTE $p$
            CREATE POLICY "Members can view collections" ON collections
                FOR SELECT USING (
                    brand_id IN (SELECT id FROM brands WHERE account_id IN (SELECT get_user_account_ids()))
                    OR brand_id IN (SELECT id FROM brands WHERE account_id IN (SELECT id FROM accounts WHERE is_published = true))
                )
        $p$;

        EXECUTE $p$
            CREATE POLICY "Editors can write collections" ON collections
                FOR INSERT WITH CHECK (
                    brand_id IN (
                        SELECT id FROM brands WHERE account_id IN (
                            SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
                        )
                    )
                )
        $p$;

        EXECUTE $p$
            CREATE POLICY "Editors can update collections" ON collections
                FOR UPDATE USING (
                    brand_id IN (
                        SELECT id FROM brands WHERE account_id IN (
                            SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
                        )
                    )
                )
        $p$;

        EXECUTE $p$
            CREATE POLICY "Editors can delete collections" ON collections
                FOR DELETE USING (
                    brand_id IN (
                        SELECT id FROM brands WHERE account_id IN (
                            SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
                        )
                    )
                )
        $p$;
    END IF;
END $$;
