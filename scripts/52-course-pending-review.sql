-- Allow lecturers to submit courses for admin review before publishing
-- Run in Supabase SQL Editor after scripts/51-public-comments-posts.sql

ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_status_check;

ALTER TABLE courses
  ADD CONSTRAINT courses_status_check
  CHECK (status IN ('draft', 'published', 'archived', 'pending_review'));

NOTIFY pgrst, 'reload schema';
