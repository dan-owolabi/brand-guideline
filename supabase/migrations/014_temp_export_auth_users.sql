-- ============================================
-- Migration 014: TEMPORARY migration helper — export auth.users
--
-- ⚠️  DELETE THIS FUNCTION AFTER CUTOVER. Run 015_drop_export_helper.sql.
--
-- WHY THIS EXISTS
-- The Mongo migration must carry each user's bcrypt password hash across, so
-- people keep their existing passwords instead of being forced through a reset.
-- Neither route to that data works here:
--
--   * PostgREST exposes only the `public` schema, so auth.users is unreachable
--     over the REST API even with the service_role key.
--   * GoTrue's /auth/v1/admin/users deliberately omits encrypted_password.
--   * A direct Postgres connection would work, but Supabase now makes direct
--     connections IPv6-only (IPv4 is a paid add-on), so pg_dump is not
--     available on this project.
--
-- So: a narrowly-scoped SECURITY DEFINER function in `public`, callable ONLY
-- by service_role, that returns exactly the fields the import needs.
--
-- SECURITY NOTES
--   * EXECUTE is granted to service_role ONLY, and explicitly revoked from
--     anon, authenticated and PUBLIC. A leak of this function to anon would
--     expose every password hash in the project.
--   * It returns hashes, not passwords. They are bcrypt, cost 10 — expensive
--     to attack but not free, which is why this is temporary.
--   * The migration is run more than once (rehearsal, then a delta at
--     cutover), which is why this is a function rather than a manual export.
-- ============================================

CREATE OR REPLACE FUNCTION public.export_auth_users()
RETURNS TABLE (
    id                 UUID,
    email              TEXT,
    encrypted_password TEXT,
    email_confirmed_at TIMESTAMPTZ,
    created_at         TIMESTAMPTZ,
    updated_at         TIMESTAMPTZ,
    raw_user_meta_data JSONB
)
SECURITY DEFINER
SET search_path = auth, public
LANGUAGE sql
STABLE
AS $$
    SELECT
        u.id,
        u.email::TEXT,
        u.encrypted_password::TEXT,
        u.email_confirmed_at,
        u.created_at,
        u.updated_at,
        u.raw_user_meta_data
    FROM auth.users u
    -- Never-confirmed signups are abandoned registrations; importing them
    -- would create unusable accounts and reserve their email addresses.
    WHERE u.email IS NOT NULL
      AND u.email_confirmed_at IS NOT NULL
$$;

-- Lock it down. The default is EXECUTE for PUBLIC, which would be a disaster.
REVOKE ALL   ON FUNCTION public.export_auth_users() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.export_auth_users() TO service_role;

-- ============================================
-- Verification
--
--   As service_role:  POST /rest/v1/rpc/export_auth_users  -> rows
--   As anon:          POST /rest/v1/rpc/export_auth_users  -> 401/403
--
-- Then, after cutover, run 015_drop_export_helper.sql.
-- ============================================
