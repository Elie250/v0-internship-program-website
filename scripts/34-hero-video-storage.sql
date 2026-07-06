-- Allow large hero videos in platform-media bucket (up to 500 MB)
UPDATE storage.buckets
SET
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
WHERE id = 'platform-media';

INSERT INTO site_settings (key, value) VALUES
  ('hero_videos_base_url', '')
ON CONFLICT (key) DO NOTHING;
