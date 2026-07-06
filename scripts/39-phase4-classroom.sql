-- Phase 4: session kit fields, drip content unlock rules
-- Run in Supabase SQL Editor after scripts/38-classroom-enhancements.sql

ALTER TABLE course_sessions
  ADD COLUMN IF NOT EXISTS session_materials TEXT,
  ADD COLUMN IF NOT EXISTS pre_session_checklist TEXT;

ALTER TABLE course_content
  ADD COLUMN IF NOT EXISTS unlock_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unlock_after_content_id UUID REFERENCES course_content(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS course_content_unlock_at_idx
  ON course_content (course_id, unlock_at)
  WHERE unlock_at IS NOT NULL;

ALTER TABLE course_assessments
  ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;

NOTIFY pgrst, 'reload schema';
