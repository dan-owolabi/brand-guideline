-- ============================================
-- Migration 013: Repair anonymous asset/collection reads after migration 011,
--                and apply 012's brand-level scoping correctly.
--
-- SUPERSEDES migration 012. If you have not run 012, skip it and run this
-- instead. If you already ran 012, running this fixes it — 012's policies are
-- replaced wholesale below.
--
-- ── SYMPTOM ──────────────────────────────────────────────────────────
-- After 011, public asset pages return:
--     401  permission denied for table brands
-- on GET /rest/v1/assets and /rest/v1/collections.
--
-- ── CAUSE ────────────────────────────────────────────────────────────
-- Anon still holds SELECT on assets and collections. The failure is inside the
-- POLICY, which reads brands in a subquery:
--
--     brand_id IN (SELECT id FROM brands WHERE account_id IN (...))
--
-- Migration 011 revoked anon's SELECT on brands. Postgres resolves table
-- permissions for everything a policy touches when it plans the query, so the
-- statement is rejected before any row filtering happens. Both branches of the
-- OR are checked, so it is not enough for only the public branch to avoid
-- brands — any direct reference anywhere in the expression fails for anon.
--
-- Migration 012 has the same defect: its policy bodies also select from brands
-- and accounts directly. Applying it would not have fixed this.
--
-- ── FIX ──────────────────────────────────────────────────────────────
-- Move both branches behind SECURITY DEFINER functions, so the policy never
-- names a table the caller lacks rights to. This is the same technique
-- migration 004 used to break the account_members recursion — the helper runs
-- as its owner, so anon's missing grant on brands is irrelevant.
--
-- Scoping is BRAND-level, not account-level (this is 012's intent, preserved):
-- publishing one guideline must not expose the uploaded files of unpublished
-- sibling brands in the same account.
--
-- Idempotent. Safe to run multiple times.
-- ============================================

-- ============================================
-- 1. SECURITY DEFINER helpers
-- ============================================

-- Brands inside accounts the caller is a member of (any publication state).
CREATE OR REPLACE FUNCTION public.get_user_brand_ids()
RETURNS SETOF UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE sql STABLE
AS $$
    SELECT b.id
    FROM brands b
    WHERE b.account_id IN (SELECT get_user_account_ids())
$$;

-- Brands that are themselves published, inside a published account.
-- Independent of the caller — this is the anonymous surface.
CREATE OR REPLACE FUNCTION public.get_public_brand_ids()
RETURNS SETOF UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE sql STABLE
AS $$
    SELECT b.id
    FROM brands b
    JOIN accounts a ON a.id = b.account_id
    WHERE a.is_published = true
      AND b.published IS NOT NULL
$$;

-- Anon must be able to call these, or the policy fails the same way the
-- direct table reference did.
GRANT EXECUTE ON FUNCTION public.get_user_brand_ids()   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_brand_ids() TO anon, authenticated;

-- ============================================
-- 2. Rewrite the SELECT policies to use only those helpers
-- ============================================

DO $$
BEGIN

IF EXISTS (SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = 'assets') THEN

    DROP POLICY IF EXISTS "Members can view assets" ON public.assets;

    EXECUTE $p$
        CREATE POLICY "Members can view assets" ON public.assets
            FOR SELECT USING (
                brand_id IN (SELECT get_user_brand_ids())
                OR brand_id IN (SELECT get_public_brand_ids())
            )
    $p$;

END IF;

IF EXISTS (SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = 'collections') THEN

    DROP POLICY IF EXISTS "Members can view collections" ON public.collections;

    EXECUTE $p$
        CREATE POLICY "Members can view collections" ON public.collections
            FOR SELECT USING (
                brand_id IN (SELECT get_user_brand_ids())
                OR brand_id IN (SELECT get_public_brand_ids())
            )
    $p$;

END IF;

END $$;

-- ============================================
-- 3. Make sure anon still has the table-level grant
--    (RLS filters rows; the GRANT is a separate gate and must be present.)
-- ============================================

GRANT SELECT ON public.assets      TO anon, authenticated;
GRANT SELECT ON public.collections TO anon, authenticated;

-- ============================================
-- 4. Verification
--
-- bash scripts/verify_public_leak.sh   -> still PASS, and the two
--                                         informational lines flip 401 -> 200
--
-- As anon:
--   GET /rest/v1/assets?select=id            -> 200
--   GET /rest/v1/brands?select=draft         -> 401  (011 still holds)
--
-- Manual: open a published brand's public /assets page — files list again.
-- Then unpublish a sibling brand in the same account and confirm its assets
-- are NOT returned to anon.
-- ============================================
