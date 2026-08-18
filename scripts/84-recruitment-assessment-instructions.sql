-- Candidate pre-instructions shown before starting a Talent technical assessment.
-- Run in Supabase SQL Editor after scripts/83-recruitment-question-type-mix.sql.

ALTER TABLE recruitment_screening_configs
  ADD COLUMN IF NOT EXISTS candidate_instructions TEXT;

COMMENT ON COLUMN recruitment_screening_configs.candidate_instructions IS
  'Optional employer-authored briefing shown to the candidate before they start the assessment.';
