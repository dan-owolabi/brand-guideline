-- ============================================
-- Migration 009: Let account co-members view each other's basic profile
--
-- The only SELECT policy on `users` was "view own profile"
-- (auth.uid() = id). AccountSettings.jsx queries users by a list of
-- teammate IDs to show email/avatar in the members list — under real
-- RLS enforcement that query would only ever return the current user's
-- own row, leaving every other teammate's info blank.
-- ============================================

DROP POLICY IF EXISTS "Account co-members can view each other" ON users;
CREATE POLICY "Account co-members can view each other" ON users
    FOR SELECT USING (
        id IN (
            SELECT user_id FROM account_members
            WHERE account_id IN (SELECT get_user_account_ids())
        )
    );
