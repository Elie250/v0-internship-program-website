-- Link enrollments to user accounts + course access windows
-- Run after scripts/11-course-enrollments.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS access_starts_at TIMESTAMPTZ;
ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS access_ends_at TIMESTAMPTZ;
ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS admitted_at TIMESTAMPTZ;
ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS cohort_label TEXT;

ALTER TABLE courses ADD COLUMN IF NOT EXISTS program_start_date DATE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS program_end_date DATE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS default_access_days INT DEFAULT 90;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS max_seats INT;

CREATE INDEX IF NOT EXISTS course_enrollments_user_id_idx ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS course_enrollments_user_course_idx ON course_enrollments(user_id, course_id);

-- Backfill user_id from matching email
UPDATE course_enrollments ce
SET user_id = u.id,
    updated_at = NOW()
FROM users u
WHERE ce.user_id IS NULL
  AND lower(trim(ce.applicant_email)) = lower(trim(u.email));

-- Backfill admitted_at for existing admitted rows
UPDATE course_enrollments
SET admitted_at = COALESCE(admitted_at, updated_at, created_at)
WHERE status = 'admitted' AND admitted_at IS NULL;

NOTIFY pgrst, 'reload schema';
