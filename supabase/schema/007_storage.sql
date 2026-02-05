-- ============================================
-- 007_storage.sql
-- Supabase Storage bucket configuration
-- ============================================

-- Create storage bucket for brand assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for brand-assets bucket

-- Anyone can view public assets
CREATE POLICY "Public can view brand assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'brand-assets');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload assets"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'brand-assets' 
        AND auth.role() = 'authenticated'
    );

-- Users can update their own uploads
CREATE POLICY "Users can update own assets"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'brand-assets' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own uploads
CREATE POLICY "Users can delete own assets"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'brand-assets' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
