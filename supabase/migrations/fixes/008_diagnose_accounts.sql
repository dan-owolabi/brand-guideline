-- DIAGNOSTIC: WHY DOES THE DASHBOARD SEE 0 ACCOUNTS?
-- Run this to see exactly what the database returns for your user.

DO $$
DECLARE
    v_email TEXT := 'owolabidaniel30@gmail.com'; 
    v_user_id UUID;
    v_count INT;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    RAISE NOTICE '------------------------------------------------';
    RAISE NOTICE 'USER ID CHECK: %', v_user_id;

    -- 1. Check Account Memberships
    RAISE NOTICE 'Checking account_members table...';
    FOR v_count IN 
        SELECT count(*) FROM account_members WHERE user_id = v_user_id
    LOOP
        RAISE NOTICE 'Found % rows in account_members for this user.', v_count;
    END LOOP;

    -- 2. Detail listing
    RAISE NOTICE 'Listing Account Details:';
    FOR v_count IN 
        SELECT count(*) 
        FROM account_members am
        JOIN accounts a ON a.id = am.account_id
        WHERE am.user_id = v_user_id
    LOOP
        -- This loop runs once with the count, but we want the actual rows.
        -- We'll just rely on the count for the Notice.
        RAISE NOTICE 'User is linked to % valid accounts.', v_count;
    END LOOP;

    -- 3. Check RLS on account_members (Simulate the query)
    -- We can't fully simulate RLS effectively in a DO block without SET ROLE, 
    -- but we can check if the row exists purely as admin.
    
    RAISE NOTICE '------------------------------------------------';
END $$;

-- 4. RAW QUERY (Run this separately to see the actual rows in the results grid)
SELECT 
    am.user_id,
    am.role,
    a.id as account_id,
    a.slug as account_slug,
    a.name as account_name
FROM account_members am
JOIN accounts a ON a.id = am.account_id
WHERE am.user_id = (SELECT id FROM auth.users WHERE email = 'owolabidaniel30@gmail.com');
