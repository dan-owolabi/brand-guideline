-- ============================================
-- Migration 010: Add column-scoped public read views
--
-- PART 1 OF 2 — NON-BREAKING. Safe to run immediately.
-- The actual lockdown is migration 011, which BREAKS the legacy Vite app.
-- Read the header of 011 before running it.
--
-- PROBLEM
-- Migration 004 created these SELECT policies:
--
--   brands:   USING (account_id IN (get_user_account_ids())
--                    OR account_id IN (SELECT id FROM accounts WHERE is_published))
--   accounts: USING (id IN (get_user_account_ids()) OR is_published = true)
--
-- Both are ROW-scoped but not COLUMN-scoped, and PostgREST lets the caller
-- choose columns. So any anonymous visitor can run:
--
--   GET /brands?select=draft&account_id=eq.<any published account>
--
-- and read the UNPUBLISHED draft content of every published account.
-- The same shape on /accounts exposes billing_email and plan.
--
-- THIS MIGRATION
-- Creates views exposing an explicit column allowlist and grants them to
-- anon. It does NOT yet revoke base-table access, so nothing breaks and the
-- hole is still open until 011 runs. This exists so the Next app can be
-- built and verified against the views while Vite continues to work.
--
-- Idempotent. Safe to run multiple times.
-- ============================================

-- security_invoker = false (the default) means the view executes with its
-- owner's privileges and is therefore the security boundary itself, rather
-- than deferring to the caller's RLS on the base table. security_barrier
-- stops the planner pushing user-supplied predicates below the WHERE clause,
-- which would otherwise be a side-channel.

DROP VIEW IF EXISTS public.public_brands;
CREATE VIEW public.public_brands
    WITH (security_barrier = true, security_invoker = false)
AS
    SELECT
        b.id,
        b.account_id,
        b.name,
        b.slug,
        b.logo_url,
        b.banner_url,        -- required by AssetsPage in public (isAdmin=false) mode
        b.primary_color,
        b.published          -- published content only; `draft` is NEVER exposed
    FROM public.brands b
    JOIN public.accounts a ON a.id = b.account_id
    WHERE a.is_published = true;
-- NOTE: deliberately NOT filtering on `b.published IS NOT NULL`. An
-- unpublished brand should still resolve as a row (with published = NULL) so
-- the UI can render "not published yet" rather than a 404. No draft content
-- is exposed either way, because `draft` is not in the column list.

DROP VIEW IF EXISTS public.public_accounts;
CREATE VIEW public.public_accounts
    WITH (security_barrier = true, security_invoker = false)
AS
    SELECT
        a.id,
        a.name,
        a.slug,
        a.logo_url,
        a.custom_domain      -- billing_email and plan are NEVER exposed
    FROM public.accounts a
    WHERE a.is_published = true;

GRANT SELECT ON public.public_brands   TO anon, authenticated;
GRANT SELECT ON public.public_accounts TO anon, authenticated;

-- ============================================
-- Verification (after this migration, before 011)
--
--   GET /rest/v1/public_brands?slug=eq.<slug>   -> 200, and no `draft` key
--   GET /rest/v1/public_brands?select=draft     -> 400, column does not exist
--   GET /rest/v1/brands?select=draft            -> STILL LEAKS until 011 runs
-- ============================================
