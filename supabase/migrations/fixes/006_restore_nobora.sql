-- RESTORE PRODUCTION SITE SCRIPT
-- This moves brands BACK to the 'nobora' account and adds you as a member of it.

DO $$
DECLARE
    v_email TEXT := 'owolabidaniel30@gmail.com'; 
    v_user_id UUID;
    v_nobora_account_id UUID;
    v_current_private_account_id UUID;
BEGIN
    -- 1. Get User ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    
    -- 2. Find the 'nobora' account ID (used by the live site)
    -- We look for slug 'nobora'
    SELECT id INTO v_nobora_account_id FROM accounts WHERE slug = 'nobora';

    -- If 'nobora' account doesn't exist, we try to create it to save the day
    IF v_nobora_account_id IS NULL THEN
        RAISE NOTICE 'Account "nobora" not found, creating it...';
        INSERT INTO accounts (name, slug, is_published)
        VALUES ('Nobora Brand', 'nobora', true)
        RETURNING id INTO v_nobora_account_id;
    END IF;

    -- 3. Add YOU to the 'nobora' account so you can see it in the dashboard
    INSERT INTO account_members (account_id, user_id, role)
    VALUES (v_nobora_account_id, v_user_id, 'owner')
    ON CONFLICT (account_id, user_id) DO NOTHING;

    -- 4. Move ALL brands to the 'nobora' account
    -- (This fixes the "No brand guidelines found" error on the live site)
    UPDATE brands 
    SET account_id = v_nobora_account_id;
    
    -- 5. Ensure the account is published
    UPDATE accounts SET is_published = true WHERE id = v_nobora_account_id;

    RAISE NOTICE 'SUCCESS: Restored brands to "nobora" account and added you as Owner.';
END $$;
