-- ============================================
-- Migration 004: Fix recursive RLS on account_members
-- The SELECT policy on account_members references itself,
-- causing infinite recursion and returning zero rows.
-- Fix: use a SECURITY DEFINER helper function.
-- Safe to run multiple times (idempotent).
-- ============================================

-- Create a SECURITY DEFINER function to get the current user's account IDs
-- This bypasses RLS, breaking the recursion
CREATE OR REPLACE FUNCTION public.get_user_account_ids()
RETURNS SETOF UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE sql STABLE
AS $$
    SELECT account_id FROM account_members WHERE user_id = auth.uid()
$$;

-- Owner-only variant
CREATE OR REPLACE FUNCTION public.get_user_owned_account_ids()
RETURNS SETOF UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE sql STABLE
AS $$
    SELECT account_id FROM account_members
    WHERE user_id = auth.uid() AND role = 'owner'
$$;

-- ============================================
-- Fix account_members policies
-- ============================================

-- Drop the recursive policy
DROP POLICY IF EXISTS "Members can view account memberships" ON account_members;
DROP POLICY IF EXISTS "Owners can insert memberships" ON account_members;
DROP POLICY IF EXISTS "Owners can delete memberships" ON account_members;

-- Recreate using the SECURITY DEFINER function (no recursion)
CREATE POLICY "Members can view account memberships" ON account_members
    FOR SELECT USING (
        account_id IN (SELECT get_user_account_ids())
    );

CREATE POLICY "Owners can insert memberships" ON account_members
    FOR INSERT WITH CHECK (
        account_id IN (SELECT get_user_owned_account_ids())
    );

CREATE POLICY "Owners can delete memberships" ON account_members
    FOR DELETE USING (
        account_id IN (SELECT get_user_owned_account_ids())
    );

-- ============================================
-- Fix accounts policies (also self-referencing)
-- ============================================

DROP POLICY IF EXISTS "Members can view accounts" ON accounts;
DROP POLICY IF EXISTS "Owners can update accounts" ON accounts;

CREATE POLICY "Members can view accounts" ON accounts
    FOR SELECT USING (
        id IN (SELECT get_user_account_ids())
        OR is_published = true
    );

CREATE POLICY "Owners can update accounts" ON accounts
    FOR UPDATE USING (
        id IN (SELECT get_user_owned_account_ids())
    );

-- Drop the duplicate public policy if it conflicts
DROP POLICY IF EXISTS "Public can view published accounts" ON accounts;

-- ============================================
-- Fix brands policies (also reference account_members directly)
-- ============================================

DROP POLICY IF EXISTS "Members can view account brands" ON brands;
DROP POLICY IF EXISTS "Editors can insert brands" ON brands;
DROP POLICY IF EXISTS "Editors can update brands" ON brands;
DROP POLICY IF EXISTS "Editors can delete brands" ON brands;

CREATE POLICY "Members can view account brands" ON brands
    FOR SELECT USING (
        account_id IN (SELECT get_user_account_ids())
        OR account_id IN (SELECT id FROM accounts WHERE is_published = true)
    );

CREATE POLICY "Editors can insert brands" ON brands
    FOR INSERT WITH CHECK (
        account_id IN (
            SELECT account_id FROM account_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

CREATE POLICY "Editors can update brands" ON brands
    FOR UPDATE USING (
        account_id IN (
            SELECT account_id FROM account_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

CREATE POLICY "Editors can delete brands" ON brands
    FOR DELETE USING (
        account_id IN (
            SELECT account_id FROM account_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

-- ============================================
-- Fix account_invites policies (also reference account_members)
-- ============================================

DROP POLICY IF EXISTS "Owners can view invites" ON account_invites;
DROP POLICY IF EXISTS "Owners can create invites" ON account_invites;
DROP POLICY IF EXISTS "Owners can delete invites" ON account_invites;

CREATE POLICY "Owners can view invites" ON account_invites
    FOR SELECT USING (
        account_id IN (SELECT get_user_owned_account_ids())
    );

CREATE POLICY "Owners can create invites" ON account_invites
    FOR INSERT WITH CHECK (
        account_id IN (SELECT get_user_owned_account_ids())
    );

CREATE POLICY "Owners can delete invites" ON account_invites
    FOR DELETE USING (
        account_id IN (SELECT get_user_owned_account_ids())
    );
