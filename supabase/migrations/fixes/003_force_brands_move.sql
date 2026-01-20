-- FINAL RECOVERY SCRIPT
-- This script force-moves ALL brands to the account the user is currently looking at.

DO $$
DECLARE
    -- REPLACE THIS WITH YOUR EXACT EMAIL
    v_user_email TEXT := 'owolabidaniel30@gmail.com'; 
    v_user_id UUID;
    v_account_id UUID;
BEGIN
    -- 1. Find your User ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found! Please check the email address.';
    END IF;

    -- 2. Find the PRIMARY account this user is a member of (the one the dashboard sees)
    SELECT account_id INTO v_account_id 
    FROM account_members 
    WHERE user_id = v_user_id 
    ORDER BY created_at DESC -- Prefer the most recently created one (likely the auto-created one)
    LIMIT 1;

    -- 3. If no account exists yet, force-create one
    IF v_account_id IS NULL THEN
        INSERT INTO accounts (name, slug, is_published)
        VALUES ('My Brand Team', 'my-team-' || floor(extract(epoch from now())), true)
        RETURNING id INTO v_account_id;
        
        INSERT INTO account_members (account_id, user_id, role)
        VALUES (v_account_id, v_user_id, 'owner');
        
        RAISE NOTICE 'Created new account % for user', v_account_id;
    ELSE
        RAISE NOTICE 'Found existing account % for user', v_account_id;
    END IF;

    -- 4. CRITICAL STEP: Move ALL brands to this specific account
    -- We removed the filter "WHERE account_id IS NULL" so it grabs EVERYTHING
    UPDATE brands 
    SET account_id = v_account_id;
    
    RAISE NOTICE 'SUCCESS: Moved ALL brands to account %', v_account_id;
END $$;
