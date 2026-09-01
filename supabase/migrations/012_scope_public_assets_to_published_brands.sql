-- ============================================
-- ⚠️  SUPERSEDED BY MIGRATION 013 — DO NOT RUN THIS FILE.
--
-- The intent below (brand-level rather than account-level scoping) is correct
-- and is preserved in 013. The implementation is not: these policy bodies read
-- `brands` and `accounts` directly, and migration 011 revoked anon's SELECT on
-- both. Postgres resolves table permissions for everything a policy touches at
-- plan time, so anon gets "permission denied for table brands" and the public
-- assets page 401s before any row filtering happens.
--
-- 013 moves both branches behind SECURITY DEFINER helpers, which is the same
-- technique migration 004 used for the account_members recursion.
--
-- Kept for history. Run 013 instead.
-- ============================================

-- ============================================
-- Migration 012: Tighten public asset visibility from account-level to
--                brand-level.
--
-- Independent of 010/011. Non-breaking for the public site.
--
-- PROBLEM
-- Migration 007 scopes anonymous asset/collection reads by ACCOUNT:
--
--   OR brand_id IN (SELECT id FROM brands
--                   WHERE account_id IN (SELECT id FROM accounts
--                                        WHERE is_published = true))
--
-- So as soon as an account is published, the assets and collection names of
-- EVERY brand in that account become anonymously readable — including brands
-- that were never published (brands.published IS NULL). A team with one live
-- guideline and three drafts is exposing the draft brands' uploaded files.
--
-- This is not a cross-tenant leak: other accounts' assets are not reachable.
-- It is a within-account granularity bug.
--
-- FIX
-- Require the BRAND itself to be published, not merely its account. Members
-- keep unchanged account-scoped access to everything they own.
--
-- Idempotent. Safe to run multiple times.
-- ============================================

DO $$
BEGIN

IF EXISTS (SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = 'assets') THEN

    DROP POLICY IF EXISTS "Members can view assets" ON public.assets;

    EXECUTE $p$
        CREATE POLICY "Members can view assets" ON public.assets
            FOR SELECT USING (
                -- Members: everything in their own accounts, published or not
                brand_id IN (
                    SELECT id FROM public.brands
                    WHERE account_id IN (SELECT get_user_account_ids())
                )
                -- Anonymous/public: only assets of brands that are themselves
                -- published, inside a published account
                OR brand_id IN (
                    SELECT b.id
                    FROM public.brands b
                    JOIN public.accounts a ON a.id = b.account_id
                    WHERE a.is_published = true
                      AND b.published IS NOT NULL
                )
            )
    $p$;

END IF;

IF EXISTS (SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = 'collections') THEN

    DROP POLICY IF EXISTS "Members can view collections" ON public.collections;

    EXECUTE $p$
        CREATE POLICY "Members can view collections" ON public.collections
            FOR SELECT USING (
                brand_id IN (
                    SELECT id FROM public.brands
                    WHERE account_id IN (SELECT get_user_account_ids())
                )
                OR brand_id IN (
                    SELECT b.id
                    FROM public.brands b
                    JOIN public.accounts a ON a.id = b.account_id
                    WHERE a.is_published = true
                      AND b.published IS NOT NULL
                )
            )
    $p$;

END IF;

END $$;

-- ============================================
-- Verification
--
-- As a member: the assets page for an UNPUBLISHED brand still lists files.
-- As anon:     the public assets page for a PUBLISHED brand still lists files,
--              and assets of an unpublished sibling brand return no rows.
-- ============================================
