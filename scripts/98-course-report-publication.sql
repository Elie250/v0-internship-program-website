-- Programme report publication. Additive / idempotent.
-- Does not change courses.status, enrollments, lessons, or payments.
-- Run in Supabase SQL Editor after scripts/97-course-report-profiles.sql.
-- Existing rows stay draft until an administrator publishes them.
-- Application-layer authorization is still required: supabaseAdmin bypasses RLS.

ALTER TABLE course_report_profiles
  ADD COLUMN IF NOT EXISTS publication_status TEXT NOT NULL DEFAULT 'draft';

UPDATE course_report_profiles
SET publication_status = 'draft'
WHERE publication_status IS NULL
   OR publication_status NOT IN ('draft', 'published');

ALTER TABLE course_report_profiles
  DROP CONSTRAINT IF EXISTS course_report_profiles_publication_status_check;

ALTER TABLE course_report_profiles
  ADD CONSTRAINT course_report_profiles_publication_status_check
  CHECK (publication_status IN ('draft', 'published'));

ALTER TABLE course_report_profiles
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

COMMENT ON COLUMN course_report_profiles.publication_status IS
  'draft is admin-only. published editorial copy is visible on admitted student reports. Independent of courses.status.';

NOTIFY pgrst, 'reload schema';
