-- Fix Infinite Recursion in RLS Policy for account_members

-- The issue is that the policy on 'account_members' tries to SELECT from 'account_members' to check permissions,
-- causing an infinite loop. We fix this by creating a SECURITY DEFINER function that bypasses RLS
-- specifically for fetching the current user's account IDs.

-- 1. Create a helper function to get current user's account IDs securely
CREATE OR REPLACE FUNCTION get_my_account_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT account_id 
    FROM account_members 
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "Members can view account memberships" ON account_members;

-- 3. Create the new non-recursive policy using the helper function
CREATE POLICY "Members can view account memberships" ON account_members
    FOR SELECT USING (
        -- Users can always see their own row
        user_id = auth.uid()
        OR
        -- OR they can see rows for accounts they belong to (fetched safely via function)
        account_id IN (SELECT get_my_account_ids())
    );

-- 4. Owners policy was also potentially risky, let's explicit fix that too just in case
DROP POLICY IF EXISTS "Owners can insert memberships" ON account_members;
CREATE POLICY "Owners can insert memberships" ON account_members
    FOR INSERT WITH CHECK (
        account_id IN (
            -- We can use the function here too for safety, but checking role requires raw table access too.
            -- Since this is INSERT, it's less prone to select-recursion, but let's be safe.
            SELECT account_id FROM account_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );
