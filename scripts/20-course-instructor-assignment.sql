-- Course lecturer assignment and schedule columns
-- Run in Supabase SQL editor if course edits fail.

ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_id UUID;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS program TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS program_type TEXT DEFAULT 'training';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS meeting_link TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS program_start_date DATE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS program_end_date DATE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS default_access_days INT DEFAULT 90;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS max_seats INT;

CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses (instructor_id);

NOTIFY pgrst, 'reload schema';
