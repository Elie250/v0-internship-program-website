-- Phase 6: Academy fullscreen policy + integrity signal support
-- Run after scripts/81-academy-assessment-variants.sql
-- Advisory only — does not auto-void or change scores.

ALTER TABLE course_assessments
  ADD COLUMN IF NOT EXISTS require_fullscreen BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN course_assessments.require_fullscreen IS
  'When true, student UI requests fullscreen for the attempt; exits are logged as integrity signals.';

NOTIFY pgrst, 'reload schema';
