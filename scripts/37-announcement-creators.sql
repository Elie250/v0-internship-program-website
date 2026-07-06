-- Platform announcement creator attribution + optional programme scope
-- Run in Supabase SQL Editor after scripts/36-lecturer-classroom.sql

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS creator_role TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS creator_name TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS announcements_course_idx ON announcements (course_id, created_at DESC);

NOTIFY pgrst, 'reload schema';
