-- Optional cover image for public admin-managed webinars.
-- Lecturer course webinars (course_content) are not affected.
-- Run in Supabase SQL Editor. Safe / idempotent.

ALTER TABLE webinars ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

COMMENT ON COLUMN webinars.thumbnail_url IS 'Public cover image URL for homepage and student webinar cards.';
