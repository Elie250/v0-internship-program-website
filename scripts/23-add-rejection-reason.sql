-- Fix: column course_enrollments.rejection_reason does not exist
-- Run in Supabase → SQL Editor (Production project)

ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

NOTIFY pgrst, 'reload schema';
