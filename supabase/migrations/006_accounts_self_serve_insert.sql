-- ============================================
-- Migration 006: Allow self-service account creation
--
-- Before this migration, `accounts` had no INSERT policy at all
-- (only SELECT/UPDATE), so RLS silently denied every insert. This was
-- masked in the app because the client was using the service_role key
-- (bypasses RLS) instead of the anon key — see the fix that switched
-- src/lib/supabase.js back to the anon key.
--
-- Separately, "Owners can insert memberships" on account_members only
-- allowed a user to add members to an account they already own
-- (via get_user_owned_account_ids()), which can never be true for the
-- very first membership row of a brand-new account. This adds a
-- bootstrap clause: a user may insert themselves as 'owner' of an
-- account that currently has zero members.
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can create accounts" ON accounts;
CREATE POLICY "Authenticated users can create accounts" ON accounts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Owners can insert memberships" ON account_members;
CREATE POLICY "Owners can insert memberships" ON account_members
    FOR INSERT WITH CHECK (
        account_id IN (SELECT get_user_owned_account_ids())
        OR (
            user_id = auth.uid()
            AND role = 'owner'
            AND NOT EXISTS (
                SELECT 1 FROM account_members am WHERE am.account_id = account_members.account_id
            )
        )
    );
