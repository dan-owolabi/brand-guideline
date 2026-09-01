-- ============================================
-- Migration 015: Remove the temporary auth.users export helper.
--
-- RUN THIS AFTER CUTOVER. Migration 014 created a SECURITY DEFINER function
-- that returns bcrypt password hashes; it exists only for the duration of the
-- migration and should not outlive it.
--
-- Safe to run even if 014 was never applied.
-- ============================================

DROP FUNCTION IF EXISTS public.export_auth_users();
