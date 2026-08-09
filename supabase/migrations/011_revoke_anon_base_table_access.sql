-- ============================================
-- Migration 011: Revoke anonymous base-table access (THE ACTUAL FIX)
--
-- PART 2 OF 2. Requires migration 010 to have run first.
--
-- ⚠️  THIS BREAKS THE LEGACY VITE APP.
--
-- vite/src/components/PublicBrandApp.jsx queries `brands` and `accounts`
-- directly as anon and depends on the exact policy clauses this migration
-- removes. After running this, public brand pages served by the Vite build
-- will 401 until traffic is on the Next app (which reads the 010 views).
--
-- RUN THIS WHEN either is true:
--   (a) the Next app is serving public brand pages in production, OR
--   (b) you accept a one-line change to the Vite app pointing its two
--       queries at public_brands / public_accounts.
--
-- Until then the leak described in 010 remains open. That is a deliberate,
-- time-boxed tradeoff — do not leave it open indefinitely.
--
-- Idempotent. Safe to run multiple times.
-- ============================================

-- ============================================
-- 1. Revoke base tables from anon
--    Everything the public site needs comes from the 010 views.
-- ============================================

REVOKE ALL ON public.brands   FROM anon;
REVOKE ALL ON public.accounts FROM anon;

-- ============================================
-- 2. Drop the public clauses from the base-table SELECT policies
--
-- With anon revoked these are dead for anonymous callers, but they also let
-- any AUTHENTICATED user read every published account's `draft` and
-- billing_email. Removing them closes that half of the hole too.
-- ============================================

DROP POLICY IF EXISTS "Members can view account brands" ON public.brands;
CREATE POLICY "Members can view account brands" ON public.brands
    FOR SELECT USING (
        account_id IN (SELECT get_user_account_ids())
    );

DROP POLICY IF EXISTS "Members can view accounts" ON public.accounts;
CREATE POLICY "Members can view accounts" ON public.accounts
    FOR SELECT USING (
        id IN (SELECT get_user_account_ids())
    );

-- ============================================
-- 3. Verification
--
-- As anon (apikey = anon key, no Authorization header):
--   GET /rest/v1/brands?select=draft            -> 401 / permission denied
--   GET /rest/v1/accounts?select=billing_email  -> 401 / permission denied
--   GET /rest/v1/public_brands?slug=eq.<slug>   -> 200, no `draft` key
--
-- As an authenticated NON-member of a published account:
--   GET /rest/v1/brands?select=draft&account_id=eq.<that account> -> []
--
-- As a member:
--   GET /rest/v1/brands?select=draft&account_id=eq.<their account> -> rows
-- ============================================
