-- 1. Ensure WORKSPACES and MEMBERS tables exist
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    slug TEXT UNIQUE -- Adding slug as it's common and good for URLs
);

CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 2. Add WORKSPACE_ID to BRANDS
-- We add it as nullable first to allow backfilling
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'workspace_id') THEN
        ALTER TABLE brands ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
    END IF;
END $$;

-- 3. BACKFILL DATA
DO $$
DECLARE
    v_user_email TEXT := 'owolabidaniel30@gmail.com';
    v_user_id UUID;
    v_workspace_id UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;

    IF v_user_id IS NOT NULL THEN
        -- 3a. Find or Create a Workspace for this user
        SELECT id INTO v_workspace_id FROM workspaces WHERE owner_id = v_user_id LIMIT 1;

        IF v_workspace_id IS NULL THEN
            INSERT INTO workspaces (name, slug, owner_id)
            VALUES ('My Workspace', 'my-workspace-' || floor(extract(epoch from now())), v_user_id)
            RETURNING id INTO v_workspace_id;
            
            -- Add as member (owner)
            INSERT INTO workspace_members (workspace_id, user_id, role)
            VALUES (v_workspace_id, v_user_id, 'owner');
            
            RAISE NOTICE 'Created new workspace for user: %', v_workspace_id;
        ELSE
            RAISE NOTICE 'Found existing workspace: %', v_workspace_id;
        END IF;

        -- 3b. Update existing brands
        -- Update brands that belong to this user via the old account system or are just orphans created by this user
        UPDATE brands 
        SET workspace_id = v_workspace_id 
        WHERE workspace_id IS NULL AND (
            account_id IN (SELECT id FROM accounts WHERE id IN (SELECT account_id FROM account_members WHERE user_id = v_user_id))
            OR
            TRUE -- Fallback: Just claim all NULL workspace_id brands for this user since they are the one running the script
        );
        
        -- To be safe and precise as per user request "I have existing brands (including "Nobora")":
        -- We will update ALL brands with NULL workspace_id to this user's workspace.
        UPDATE brands SET workspace_id = v_workspace_id WHERE workspace_id IS NULL;

        RAISE NOTICE 'Updated brands to use workspace_id: %', v_workspace_id;
    END IF;
END $$;

-- 4. Add NOT NULL constraint now that data is backfilled
DO $$
BEGIN
    -- Only try if there are no nulls left
    IF NOT EXISTS (SELECT 1 FROM brands WHERE workspace_id IS NULL) THEN
        ALTER TABLE brands ALTER COLUMN workspace_id SET NOT NULL;
    ELSE
        RAISE NOTICE 'WARNING: Some brands still have NULL workspace_id. Skipping NOT NULL constraint.';
    END IF;
END $$;

-- 5. RLS POLICIES
-- Update policies to use workspace_id

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts (clean slate for brands)
DROP POLICY IF EXISTS "Users can view their own brands" ON brands;
DROP POLICY IF EXISTS "Users can create their own brands" ON brands;
DROP POLICY IF EXISTS "Workspace members can view brands" ON brands;
DROP POLICY IF EXISTS "Workspace members can create brands" ON brands;
DROP POLICY IF EXISTS "Workspace members can update brands" ON brands;
DROP POLICY IF EXISTS "Workspace members can delete brands" ON brands;
DROP POLICY IF EXISTS "Members can view account brands" ON brands;
DROP POLICY IF EXISTS "Can create brands" ON brands;
DROP POLICY IF EXISTS "Can update brands" ON brands;
DROP POLICY IF EXISTS "Owners can delete brands" ON brands;


-- View Policy
CREATE POLICY "Workspace members can view brands" ON brands
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );

-- Create Policy
CREATE POLICY "Workspace members can create brands" ON brands
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );

-- Update Policy
CREATE POLICY "Workspace members can update brands" ON brands
    FOR UPDATE USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );

-- Delete Policy
CREATE POLICY "Workspace members can delete brands" ON brands
    FOR DELETE USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );
