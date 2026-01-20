-- FIX BUILDER ACCESS SCRIPT
-- This ensures you can EDIT (Update) the brand, not just view it.

-- 1. Fix UPDATE Policy for Brands
-- (The previous fix only handled SELECT. This handles saving changes.)
DROP POLICY IF EXISTS "Editors can update brands" ON brands;

CREATE POLICY "Editors can update brands" ON brands
    FOR UPDATE USING (
        account_id IN (SELECT get_my_account_ids())
    );

-- 2. Diagnostic: Check if 'nobora' has a draft
DO $$
DECLARE
    v_slug TEXT := 'nobora';
    v_has_draft BOOLEAN;
    v_brand_id UUID;
BEGIN
    SELECT id, (draft IS NOT NULL) INTO v_brand_id, v_has_draft
    FROM brands WHERE slug = v_slug;

    IF v_brand_id IS NULL THEN
        RAISE NOTICE 'Alert: "nobora" brand not found via slug lookup.';
    ELSE
        RAISE NOTICE 'Brand "nobora" found (ID: %). Draft exists: %', v_brand_id, v_has_draft;
    END IF;
END $$;
