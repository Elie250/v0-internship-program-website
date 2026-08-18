-- Question type mix for auto-select from bank (multiple / short / open percentages)
-- Run in Supabase SQL Editor after prior recruitment scripts.

ALTER TABLE recruitment_screening_configs
  ADD COLUMN IF NOT EXISTS question_type_mix JSONB NOT NULL DEFAULT '{
    "multiple": 50,
    "short": 30,
    "open": 20
  }'::jsonb;

COMMENT ON COLUMN recruitment_screening_configs.question_type_mix IS
  'Target share of assessment items by kind: multiple (MCQ/multi-select), short (exact/numeric), open (guided short_text). Percents should sum to 100.';
