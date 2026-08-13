-- Academy STEM parameter variants + attempt materialization
-- Run after scripts/80-academy-assessment-integrity-bands.sql
-- Placeholders like {V} / expression-based MCQ options are resolved server-side per attempt.

ALTER TABLE assessment_questions
  ADD COLUMN IF NOT EXISTS parameters JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS answer_spec JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE assessment_attempts
  ADD COLUMN IF NOT EXISTS variant_seed TEXT,
  ADD COLUMN IF NOT EXISTS parameters_resolved JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS client_meta_hash TEXT;

COMMENT ON COLUMN assessment_questions.parameters IS
  'Parameter definitions for STEM variants, e.g. [{"key":"V","min":10,"max":24,"type":"integer","unit":"V"}]';
COMMENT ON COLUMN assessment_questions.answer_spec IS
  'Optional { expression, distractorExpressions } to build numeric MCQ options per attempt.';
COMMENT ON COLUMN assessment_attempts.parameters_resolved IS
  'Per-question materialized params/options/correctIndex for this attempt only.';

NOTIFY pgrst, 'reload schema';
