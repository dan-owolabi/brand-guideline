-- FIX BRANDS RLS TO USE WORKSPACE_ID INSTEAD OF ACCOUNT_ID
-- The app now uses workspace_id for brand access control

-- 1. Drop the old account-based policy
DROP POLICY IF EXISTS "Members can view account brands" ON brands;

-- 2. Create new workspace-based SELECT policy
CREATE POLICY "Members can view workspace brands" ON brands
    FOR SELECT USING (
        workspace_id IN (SELECT get_my_workspace_ids())
    );

-- 3. Ensure UPDATE policy exists for workspace members
DROP POLICY IF EXISTS "Members can update workspace brands" ON brands;
CREATE POLICY "Members can update workspace brands" ON brands
    FOR UPDATE USING (
        workspace_id IN (SELECT get_my_workspace_ids())
    );

-- 4. Ensure INSERT policy exists for workspace members
DROP POLICY IF EXISTS "Members can insert workspace brands" ON brands;
CREATE POLICY "Members can insert workspace brands" ON brands
    FOR INSERT WITH CHECK (
        workspace_id IN (SELECT get_my_workspace_ids())
    );

-- 5. Ensure DELETE policy exists for workspace members
DROP POLICY IF EXISTS "Members can delete workspace brands" ON brands;
CREATE POLICY "Members can delete workspace brands" ON brands
    FOR DELETE USING (
        workspace_id IN (SELECT get_my_workspace_ids())
    );

-- 6. Verification
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'brands';
    RAISE NOTICE 'Total brands policies after fix: %', v_count;
END $$;
