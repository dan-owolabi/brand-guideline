-- ============================================
-- Migration 003: Account Invites
-- Adds invite system for team member invitations
-- Safe to run multiple times (idempotent)
-- ============================================

-- Create account_invites table
CREATE TABLE IF NOT EXISTS account_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
    invited_by UUID REFERENCES users(id),
    token UUID NOT NULL DEFAULT uuid_generate_v4(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days')
);

-- Unique constraint: one pending invite per email per account
CREATE UNIQUE INDEX IF NOT EXISTS account_invites_unique_pending
    ON account_invites(account_id, email)
    WHERE status = 'pending';

-- Index for fast token lookups
CREATE UNIQUE INDEX IF NOT EXISTS account_invites_token_idx ON account_invites(token);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE account_invites ENABLE ROW LEVEL SECURITY;

-- Owners can view invites for their accounts
DROP POLICY IF EXISTS "Owners can view invites" ON account_invites;
CREATE POLICY "Owners can view invites" ON account_invites
    FOR SELECT USING (
        account_id IN (
            SELECT account_id FROM account_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Anyone can view invite by token (for accepting)
DROP POLICY IF EXISTS "Anyone can view invite by token" ON account_invites;
CREATE POLICY "Anyone can view invite by token" ON account_invites
    FOR SELECT USING (true);

-- Owners can create invites
DROP POLICY IF EXISTS "Owners can create invites" ON account_invites;
CREATE POLICY "Owners can create invites" ON account_invites
    FOR INSERT WITH CHECK (
        account_id IN (
            SELECT account_id FROM account_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Owners can delete/revoke invites
DROP POLICY IF EXISTS "Owners can delete invites" ON account_invites;
CREATE POLICY "Owners can delete invites" ON account_invites
    FOR DELETE USING (
        account_id IN (
            SELECT account_id FROM account_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Owners can update invites (for accepting)
DROP POLICY IF EXISTS "Anyone can update invite status" ON account_invites;
CREATE POLICY "Anyone can update invite status" ON account_invites
    FOR UPDATE USING (true)
    WITH CHECK (true);

-- ============================================
-- Function: Accept an invite
-- ============================================
CREATE OR REPLACE FUNCTION accept_invite(invite_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite account_invites%ROWTYPE;
    v_user_id UUID;
    v_result JSONB;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Not authenticated');
    END IF;

    -- Find the invite
    SELECT * INTO v_invite
    FROM account_invites
    WHERE token = invite_token AND status = 'pending';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Invite not found or already used');
    END IF;

    -- Check if expired
    IF v_invite.expires_at < now() THEN
        UPDATE account_invites SET status = 'expired' WHERE id = v_invite.id;
        RETURN jsonb_build_object('error', 'Invite has expired');
    END IF;

    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM account_members
        WHERE account_id = v_invite.account_id AND user_id = v_user_id
    ) THEN
        -- Mark invite as accepted anyway
        UPDATE account_invites SET status = 'accepted' WHERE id = v_invite.id;
        RETURN jsonb_build_object('success', true, 'message', 'Already a member', 'account_id', v_invite.account_id);
    END IF;

    -- Add user as member
    INSERT INTO account_members (account_id, user_id, role, invited_by)
    VALUES (v_invite.account_id, v_user_id, v_invite.role, v_invite.invited_by);

    -- Mark invite as accepted
    UPDATE account_invites SET status = 'accepted' WHERE id = v_invite.id;

    RETURN jsonb_build_object('success', true, 'account_id', v_invite.account_id);
END;
$$;
