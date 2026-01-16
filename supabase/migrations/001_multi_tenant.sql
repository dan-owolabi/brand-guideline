-- Multi-Tenant Architecture Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ACCOUNTS TABLE (Organizations/Teams)
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,              -- {slug}.guidr.space
    custom_domain TEXT UNIQUE,               -- optional: brand.company.com
    logo_url TEXT,
    is_published BOOLEAN DEFAULT false,      -- Controls public visibility
    billing_email TEXT,
    plan TEXT DEFAULT 'free',                -- free, pro, enterprise
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast domain lookups
CREATE INDEX IF NOT EXISTS accounts_slug_idx ON accounts(slug);
CREATE INDEX IF NOT EXISTS accounts_custom_domain_idx ON accounts(custom_domain);

-- ============================================
-- 2. USERS TABLE (Profile data, linked to Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. ACCOUNT MEMBERS TABLE (User <-> Account relationship)
-- ============================================
CREATE TABLE IF NOT EXISTS account_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    invited_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(account_id, user_id)
);

CREATE INDEX IF NOT EXISTS account_members_user_idx ON account_members(user_id);
CREATE INDEX IF NOT EXISTS account_members_account_idx ON account_members(account_id);

-- ============================================
-- 4. MODIFY BRANDS TABLE (Add account ownership)
-- ============================================
ALTER TABLE brands ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS brands_account_id_idx ON brands(account_id);

-- ============================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_members ENABLE ROW LEVEL SECURITY;

-- Drop old permissive policies on brands (we'll replace them)
DROP POLICY IF EXISTS "Allow public read access on brands" ON brands;
DROP POLICY IF EXISTS "Allow public insert access on brands" ON brands;
DROP POLICY IF EXISTS "Allow public update access on brands" ON brands;
DROP POLICY IF EXISTS "Allow public delete access on brands" ON brands;

-- USERS: Users can only see/update their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ACCOUNTS: Users can see accounts they belong to
CREATE POLICY "Members can view accounts" ON accounts
    FOR SELECT USING (
        id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid())
    );

-- Public can view published accounts (for public brand sites)
CREATE POLICY "Public can view published accounts" ON accounts
    FOR SELECT USING (is_published = true);

-- Owners can update their accounts
CREATE POLICY "Owners can update accounts" ON accounts
    FOR UPDATE USING (
        id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role = 'owner')
    );

-- ACCOUNT_MEMBERS: Users can see memberships in their accounts
CREATE POLICY "Members can view account memberships" ON account_members
    FOR SELECT USING (
        account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid())
    );

-- Owners can manage memberships
CREATE POLICY "Owners can insert memberships" ON account_members
    FOR INSERT WITH CHECK (
        account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role = 'owner')
    );

CREATE POLICY "Owners can delete memberships" ON account_members
    FOR DELETE USING (
        account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role = 'owner')
    );

-- BRANDS: Members can view brands in their accounts
CREATE POLICY "Members can view account brands" ON brands
    FOR SELECT USING (
        account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid())
    );

-- Public can view brands of published accounts
CREATE POLICY "Public can view published brands" ON brands
    FOR SELECT USING (
        account_id IN (SELECT id FROM accounts WHERE is_published = true)
    );

-- Editors and owners can modify brands
CREATE POLICY "Editors can insert brands" ON brands
    FOR INSERT WITH CHECK (
        account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor'))
    );

CREATE POLICY "Editors can update brands" ON brands
    FOR UPDATE USING (
        account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor'))
    );

CREATE POLICY "Editors can delete brands" ON brands
    FOR DELETE USING (
        account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor'))
    );

-- ============================================
-- 6. HELPER FUNCTION: Get current user's accounts
-- ============================================
CREATE OR REPLACE FUNCTION get_user_accounts()
RETURNS TABLE (
    account_id UUID,
    account_name TEXT,
    account_slug TEXT,
    role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.slug,
        am.role
    FROM accounts a
    JOIN account_members am ON a.id = am.account_id
    WHERE am.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. TRIGGER: Auto-create user profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 8. MIGRATION: Assign existing brands to default account
-- ============================================
-- Create a default account for existing data
DO $$
DECLARE
    default_account_id UUID;
BEGIN
    -- Check if there are any brands without account_id
    IF EXISTS (SELECT 1 FROM brands WHERE account_id IS NULL) THEN
        -- Create default account
        INSERT INTO accounts (name, slug, is_published)
        VALUES ('Default Account', 'default', true)
        ON CONFLICT (slug) DO NOTHING
        RETURNING id INTO default_account_id;
        
        -- If account already existed, get its ID
        IF default_account_id IS NULL THEN
            SELECT id INTO default_account_id FROM accounts WHERE slug = 'default';
        END IF;
        
        -- Assign orphan brands to default account
        UPDATE brands SET account_id = default_account_id WHERE account_id IS NULL;
        
        RAISE NOTICE 'Migrated existing brands to default account: %', default_account_id;
    END IF;
END $$;
