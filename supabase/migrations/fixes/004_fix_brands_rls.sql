-- 1. Optimize BRANDS policy to use the safe helper function
-- This ensures 'brands' table doesn't hit any recursion limits either
DROP POLICY IF EXISTS "Members can view account brands" ON brands;

CREATE POLICY "Members can view account brands" ON brands
    FOR SELECT USING (
        account_id IN (SELECT get_my_account_ids())
    );

-- 2. VERIFICATION: Check how many brands you actually have
-- (Using your email directly so it works in SQL Editor)
DO $$
DECLARE
    v_email TEXT := 'owolabidaniel30@gmail.com'; 
    v_user_id UUID;
    v_count INT;
    v_account_id UUID;
BEGIN
    -- Get User ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User % not found', v_email;
        RETURN;
    END IF;

    -- Get Brand Count
    SELECT COUNT(*) INTO v_count 
    FROM brands 
    WHERE account_id IN (
        SELECT account_id FROM account_members WHERE user_id = v_user_id
    );
    
    RAISE NOTICE '------------------------------------------------';
    RAISE NOTICE 'VERIFICATION RESULT:';
    RAISE NOTICE 'User Email: %', v_email;
    RAISE NOTICE 'Total Brands Accessible: %', v_count;
    
    IF v_count = 0 THEN
        RAISE NOTICE 'WARNING: You still have 0 brands. The Force Move script might not have matched your email.';
    ELSE
        RAISE NOTICE 'SUCCESS: You have brands! The dashboard should show them.';
    END IF;
    RAISE NOTICE '------------------------------------------------';
END $$;
