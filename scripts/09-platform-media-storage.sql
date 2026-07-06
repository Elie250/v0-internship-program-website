-- Supabase Storage bucket for admin-uploaded images (products, services, logo, etc.)
-- Run in Supabase Dashboard → Storage, or SQL Editor if storage schema is enabled

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'platform-media',
  'platform-media',
  true,
  26214400,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'video/mp4',
    'video/webm',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "public_read_platform_media" ON storage.objects;
CREATE POLICY "public_read_platform_media" ON storage.objects
  FOR SELECT USING (bucket_id = 'platform-media');

DROP POLICY IF EXISTS "service_role_upload_platform_media" ON storage.objects;
CREATE POLICY "service_role_upload_platform_media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'platform-media');

DROP POLICY IF EXISTS "service_role_update_platform_media" ON storage.objects;
CREATE POLICY "service_role_update_platform_media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'platform-media');

DROP POLICY IF EXISTS "service_role_delete_platform_media" ON storage.objects;
CREATE POLICY "service_role_delete_platform_media" ON storage.objects
  FOR DELETE USING (bucket_id = 'platform-media');

INSERT INTO site_settings (key, value) VALUES
  ('company_logo_url', '/images/energy-logics-logo.png')
ON CONFLICT (key) DO NOTHING;
