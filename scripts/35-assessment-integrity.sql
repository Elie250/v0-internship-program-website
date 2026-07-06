-- Premium assessment & lesson progress integrity (anti-cheating)
-- Run in Supabase SQL Editor after scripts/27-quiz-assessments.sql and 24-lesson-progress.sql

-- Assessment policy defaults (lecturer can tune per assessment later)
ALTER TABLE course_assessments ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 3;
ALTER TABLE course_assessments ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER DEFAULT 45;
ALTER TABLE course_assessments ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE course_assessments ADD COLUMN IF NOT EXISTS shuffle_options BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE course_assessments ADD COLUMN IF NOT EXISTS require_lessons_complete BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE course_assessments ADD COLUMN IF NOT EXISTS lock_after_pass BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE course_assessments ADD COLUMN IF NOT EXISTS cooldown_minutes INTEGER NOT NULL DEFAULT 60;
-- never | after_pass | after_all_attempts
ALTER TABLE course_assessments ADD COLUMN IF NOT EXISTS reveal_answers TEXT NOT NULL DEFAULT 'after_all_attempts';

UPDATE course_assessments SET time_limit_minutes = 45 WHERE time_limit_minutes IS NULL;

-- Timed, shuffled attempt sessions (grading happens server-side only)
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES course_assessments(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'submitted', 'expired', 'voided')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  question_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  option_orders JSONB NOT NULL DEFAULT '{}'::jsonb,
  answers JSONB,
  score INTEGER,
  passed BOOLEAN,
  correct_count INTEGER,
  total_questions INTEGER,
  tab_switch_count INTEGER NOT NULL DEFAULT 0,
  integrity_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assessment_attempts_assessment_enrollment_idx
  ON assessment_attempts (assessment_id, enrollment_id, started_at DESC);

CREATE INDEX IF NOT EXISTS assessment_attempts_user_idx
  ON assessment_attempts (user_id, started_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS assessment_attempts_one_active_idx
  ON assessment_attempts (assessment_id, enrollment_id)
  WHERE status = 'in_progress';

CREATE TABLE IF NOT EXISTS assessment_attempt_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assessment_attempt_events_attempt_idx
  ON assessment_attempt_events (attempt_id, created_at);

ALTER TABLE assessment_submissions ADD COLUMN IF NOT EXISTS best_attempt_id UUID REFERENCES assessment_attempts(id) ON DELETE SET NULL;
ALTER TABLE assessment_submissions ADD COLUMN IF NOT EXISTS best_score INTEGER;
ALTER TABLE assessment_submissions ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

-- Lesson progress hardening
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS watch_percent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS completion_verified BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempt_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_public_assessment_attempts" ON assessment_attempts;
CREATE POLICY "deny_public_assessment_attempts" ON assessment_attempts
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_assessment_attempt_events" ON assessment_attempt_events;
CREATE POLICY "deny_public_assessment_attempt_events" ON assessment_attempt_events
  FOR ALL USING (false);

NOTIFY pgrst, 'reload schema';
