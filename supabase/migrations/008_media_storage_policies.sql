-- ============================================
-- Migration 008: Storage policies for the "media" bucket
--
-- supabase/schema/007_storage.sql only defined storage.objects policies
-- for a bucket named "brand-assets", but the app (src/lib/supabase.js
-- uploadFile()) uploads to a bucket named "media". Under real RLS
-- enforcement (now that the client uses the anon key, not service_role)
-- uploads/downloads against "media" would have no matching policy and
-- be denied by default.
--
-- If a "media" bucket doesn't exist yet, create it via the Supabase
-- dashboard (Storage tab) before running this, or uncomment the INSERT
-- below.
-- ============================================

-- Uncomment if the "media" bucket doesn't already exist:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('media', 'media', true)
-- ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
CREATE POLICY "Public can view media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Authenticated users can upload media"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'media'
        AND auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Authenticated users can update media" ON storage.objects;
CREATE POLICY "Authenticated users can update media"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'media'
        AND auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Authenticated users can delete media" ON storage.objects;
CREATE POLICY "Authenticated users can delete media"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'media'
        AND auth.role() = 'authenticated'
    );
