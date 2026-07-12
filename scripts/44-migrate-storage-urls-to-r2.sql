-- Rewrite stored Supabase Storage URLs to your Cloudflare R2 custom domain.
-- Run in Supabase SQL Editor AFTER copying objects to R2 (see scripts/migrate-supabase-to-r2.mjs).
--
-- 1. Replace the r2_base value below with your media domain.
-- 2. Run this script once.
-- 3. Verify a few rows (products.images, payments.receipt_url, courses.thumbnail).

DO $$
DECLARE
  r2_base text := 'https://media.energyandlogics.com';
  marker text := '/storage/v1/object/public/platform-media/';
BEGIN
  -- Simple text columns
  UPDATE services
  SET image_url = regexp_replace(image_url, '^https?://[^/]+' || marker, r2_base || '/')
  WHERE image_url LIKE '%' || marker || '%';

  UPDATE announcements
  SET image_url = regexp_replace(image_url, '^https?://[^/]+' || marker, r2_base || '/')
  WHERE image_url LIKE '%' || marker || '%';

  UPDATE courses
  SET thumbnail = regexp_replace(thumbnail, '^https?://[^/]+' || marker, r2_base || '/')
  WHERE thumbnail LIKE '%' || marker || '%';

  UPDATE course_content
  SET content_url = regexp_replace(content_url, '^https?://[^/]+' || marker, r2_base || '/')
  WHERE content_url LIKE '%' || marker || '%';

  UPDATE payments
  SET receipt_url = regexp_replace(receipt_url, '^https?://[^/]+' || marker, r2_base || '/')
  WHERE receipt_url LIKE '%' || marker || '%';

  UPDATE users
  SET profile_photo_url = regexp_replace(profile_photo_url, '^https?://[^/]+' || marker, r2_base || '/')
  WHERE profile_photo_url LIKE '%' || marker || '%';

  UPDATE lab_submissions
  SET file_url = regexp_replace(file_url, '^https?://[^/]+' || marker, r2_base || '/')
  WHERE file_url LIKE '%' || marker || '%';

  UPDATE webinars
  SET recording_url = regexp_replace(recording_url, '^https?://[^/]+' || marker, r2_base || '/')
  WHERE recording_url LIKE '%' || marker || '%';

  UPDATE course_sessions
  SET recording_url = regexp_replace(recording_url, '^https?://[^/]+' || marker, r2_base || '/')
  WHERE recording_url LIKE '%' || marker || '%';

  UPDATE events
  SET image_url = regexp_replace(image_url, '^https?://[^/]+' || marker, r2_base || '/')
  WHERE image_url LIKE '%' || marker || '%';

  UPDATE internship_applications
  SET cv_url = regexp_replace(cv_url, '^https?://[^/]+' || marker, r2_base || '/')
  WHERE cv_url LIKE '%' || marker || '%';

  -- Legacy single-image column on products (if still present)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image_url'
  ) THEN
    EXECUTE $sql$
      UPDATE products
      SET image_url = regexp_replace(image_url, '^https?://[^/]+' || $1, $2 || '/')
      WHERE image_url LIKE '%' || $1 || '%'
    $sql$ USING marker, r2_base;
  END IF;

  -- Product image gallery (JSONB array of URL strings)
  UPDATE products
  SET images = (
    SELECT COALESCE(
      jsonb_agg(
        CASE
          WHEN jsonb_typeof(elem) = 'string'
            AND elem #>> '{}' LIKE '%' || marker || '%'
          THEN to_jsonb(
            regexp_replace(elem #>> '{}', '^https?://[^/]+' || marker, r2_base || '/')
          )
          ELSE elem
        END
      ),
      '[]'::jsonb
    )
    FROM jsonb_array_elements(COALESCE(images, '[]'::jsonb)) AS elem
  )
  WHERE images::text LIKE '%' || marker || '%';

  -- Session materials: newline-separated URLs
  UPDATE course_sessions
  SET session_materials = (
    SELECT string_agg(
      CASE
        WHEN line LIKE '%' || marker || '%'
        THEN regexp_replace(line, '^https?://[^/]+' || marker, r2_base || '/')
        ELSE line
      END,
      E'\n'
    )
    FROM unnest(string_to_array(session_materials, E'\n')) AS line
  )
  WHERE session_materials LIKE '%' || marker || '%';

  -- Site settings (logo override, optional hero base)
  UPDATE site_settings
  SET value = regexp_replace(value, '^https?://[^/]+' || marker, r2_base || '/'),
      updated_at = NOW()
  WHERE key IN ('company_logo_url', 'hero_videos_base_url')
    AND value LIKE '%' || marker || '%'
    AND value NOT LIKE '/%';

  -- Hero background (skip playlist shortcut and local paths)
  UPDATE site_hero
  SET background_image = regexp_replace(background_image, '^https?://[^/]+' || marker, r2_base || '/')
  WHERE background_image LIKE '%' || marker || '%'
    AND background_image <> '/videos/playlist';
END $$;

-- Quick audit: rows that still reference Supabase storage
SELECT 'products.images' AS source, COUNT(*) AS remaining
FROM products WHERE images::text LIKE '%/storage/v1/object/public/platform-media/%'
UNION ALL
SELECT 'payments.receipt_url', COUNT(*) FROM payments WHERE receipt_url LIKE '%/storage/v1/object/public/platform-media/%'
UNION ALL
SELECT 'courses.thumbnail', COUNT(*) FROM courses WHERE thumbnail LIKE '%/storage/v1/object/public/platform-media/%'
UNION ALL
SELECT 'course_content.content_url', COUNT(*) FROM course_content WHERE content_url LIKE '%/storage/v1/object/public/platform-media/%';
