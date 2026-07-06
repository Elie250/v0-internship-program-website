-- MCQ quiz engine: lecturer-authored questions, auto-graded submissions, certificate score
-- Run in Supabase SQL Editor after scripts/22-learning-lifecycle.sql

ALTER TABLE course_assessments ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE course_assessments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE course_assessments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES course_assessments(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  -- options: ["First choice", "Second choice", ...]
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assessment_questions_assessment_idx
  ON assessment_questions (assessment_id, sort_order);

-- answers: {"<question_id>": <chosen_index>, ...}
ALTER TABLE assessment_submissions ADD COLUMN IF NOT EXISTS answers JSONB;
ALTER TABLE assessment_submissions ADD COLUMN IF NOT EXISTS correct_count INTEGER;
ALTER TABLE assessment_submissions ADD COLUMN IF NOT EXISTS total_questions INTEGER;
ALTER TABLE assessment_submissions ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 1;

ALTER TABLE student_certificates ADD COLUMN IF NOT EXISTS final_score INTEGER;

-- Correct answers must never be readable with anon/authenticated keys
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_public_assessment_questions" ON assessment_questions;
CREATE POLICY "deny_public_assessment_questions" ON assessment_questions
  FOR SELECT USING (false);

NOTIFY pgrst, 'reload schema';
