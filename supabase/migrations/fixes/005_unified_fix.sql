-- UNIFIED FIX SCRIPT
-- Run this entire block to fix "Function does not exist" and restore brand visibility.

-- 1. DEFINE THE HELPER FUNCTION (This was missing!)
CREATE OR REPLACE FUNCTION get_my_account_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT account_id 
    FROM account_members 
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. FIX ACCOUNT MEMBERS POLICY (Resolves infinite recursion)
DROP POLICY IF EXISTS "Members can view account memberships" ON account_members;
CREATE POLICY "Members can view account memberships" ON account_members
    FOR SELECT USING (
        user_id = auth.uid() 
        OR 
        account_id IN (SELECT get_my_account_ids())
    );

-- 3. FIX BRANDS POLICY (Uses the helper function)
DROP POLICY IF EXISTS "Members can view account brands" ON brands;
CREATE POLICY "Members can view account brands" ON brands
    FOR SELECT USING (
        account_id IN (SELECT get_my_account_ids())
    );

-- 4. VERIFY DATA (Check "Messages" tab output)
DO $$
DECLARE
    v_email TEXT := 'owolabidaniel30@gmail.com'; 
    v_user_id UUID;
    v_brand_count INT;
    v_account_count INT;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    -- Count Accessibl Accounts
    SELECT COUNT(*) INTO v_account_count 
    FROM account_members 
    WHERE user_id = v_user_id;

    -- Count Accessible Brands
    SELECT COUNT(*) INTO v_brand_count 
    FROM brands 
    WHERE account_id IN (
        SELECT account_id FROM account_members WHERE user_id = v_user_id
    );
    
    RAISE NOTICE '------------------------------------------------';
    RAISE NOTICE 'FINAL VERIFICATION Results:';
    RAISE NOTICE 'User Email: %', v_email;
    RAISE NOTICE 'Accounts Found: %', v_account_count;
    RAISE NOTICE 'Brands Found: %', v_brand_count;
    
    IF v_brand_count > 0 THEN
        RAISE NOTICE 'SUCCESS: Brands are visible! Reload dashboard.';
    ELSE
        RAISE NOTICE 'WARNING: Still 0 brands. Did the move script run?';
    END IF;
    RAISE NOTICE '------------------------------------------------';
END $$;
