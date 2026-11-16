-- Phase C1 verification queries (READ ONLY).
-- Do not apply migrations from this file. Run in Supabase SQL Editor after review.
-- Expected dependency order: 103 → 104 → 105 (or 105 then 105b if upgrading) → 106.
-- SQL file presence on disk does NOT mean a migration was applied.

-- ---------------------------------------------------------------------------
-- Status helper pattern:
--   status = 'PRESENT' | 'MISSING' | 'INCOMPLETE' | 'UNEXPECTED_BEFORE_106'
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 103: curriculum_learning_outcomes
-- ---------------------------------------------------------------------------
SELECT
  CASE
    WHEN to_regclass('public.curriculum_learning_outcomes') IS NULL THEN 'MISSING'
    ELSE 'PRESENT'
  END AS curriculum_learning_outcomes_status,
  to_regclass('public.curriculum_learning_outcomes') AS outcomes_table;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'curriculum_learning_outcomes'
ORDER BY ordinal_position;

SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'public.curriculum_learning_outcomes'::regclass
  AND contype = 'p';

-- ---------------------------------------------------------------------------
-- 104: course_assessments practical columns
-- Expected after 104 (and safe re-run):
--   assessment_kind  text, NOT NULL
--   delivery_mode    text, NOT NULL
--   practical_brief  jsonb, NULLABLE (quizzes keep null)
-- ---------------------------------------------------------------------------
SELECT
  CASE
    WHEN COUNT(*) FILTER (
      WHERE column_name IN ('assessment_kind', 'delivery_mode', 'practical_brief')
    ) = 3 THEN 'PRESENT'
    WHEN COUNT(*) FILTER (
      WHERE column_name IN ('assessment_kind', 'delivery_mode', 'practical_brief')
    ) = 0 THEN 'MISSING'
    ELSE 'INCOMPLETE'
  END AS migration_104_status,
  COUNT(*) FILTER (WHERE column_name = 'assessment_kind') AS has_assessment_kind,
  COUNT(*) FILTER (WHERE column_name = 'delivery_mode') AS has_delivery_mode,
  COUNT(*) FILTER (WHERE column_name = 'practical_brief') AS has_practical_brief
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'course_assessments'
  AND column_name IN ('assessment_kind', 'delivery_mode', 'practical_brief');

SELECT
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'course_assessments'
  AND column_name IN ('assessment_kind', 'delivery_mode', 'practical_brief')
ORDER BY column_name;

-- Expected row shapes after 104 (interpret manually):
-- assessment_kind | text/character varying | NO  | default quiz-ish
-- delivery_mode   | text/character varying | NO  | default not_applicable-ish
-- practical_brief | jsonb                  | YES | null default

-- ---------------------------------------------------------------------------
-- 105: rubrics / scores / RPCs
-- ---------------------------------------------------------------------------
SELECT
  CASE
    WHEN to_regclass('public.assessment_rubric_criteria') IS NULL THEN 'MISSING'
    ELSE 'PRESENT'
  END AS assessment_rubric_criteria_status,
  to_regclass('public.assessment_rubric_criteria') AS criteria_table;

SELECT
  CASE
    WHEN to_regclass('public.assessment_criterion_scores') IS NULL THEN 'MISSING'
    ELSE 'PRESENT'
  END AS assessment_criterion_scores_status,
  to_regclass('public.assessment_criterion_scores') AS scores_table;

SELECT
  CASE
    WHEN COUNT(*) = 4 THEN 'PRESENT'
    WHEN COUNT(*) = 0 THEN 'MISSING'
    ELSE 'INCOMPLETE'
  END AS migration_105_rpc_status,
  array_agg(proname ORDER BY proname) AS found_functions
FROM pg_proc
WHERE proname IN (
  'enforce_rubric_level_points_within_criterion',
  'enforce_criterion_score_integrity',
  'resubmit_practical_submission',
  'mark_practical_submission'
);

SELECT
  tgname,
  tgrelid::regclass AS table_name,
  CASE
    WHEN tgname = 'trg_lab_submission_assessment_same_course' THEN 'EXPECTED_AFTER_106'
    ELSE 'EXPECTED_AFTER_105'
  END AS expected_phase
FROM pg_trigger
WHERE NOT tgisinternal
  AND tgname IN (
    'trg_rubric_level_points_within_criterion',
    'trg_criterion_score_integrity',
    'trg_lab_submission_assessment_same_course'
  )
ORDER BY tgname;

-- Explicit pre-106 expectation for the lab same-course trigger:
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE NOT tgisinternal
        AND tgname = 'trg_lab_submission_assessment_same_course'
    ) THEN 'PRESENT'
    ELSE 'UNEXPECTED_BEFORE_106_OR_MISSING'
  END AS lab_same_course_trigger_status;

-- ---------------------------------------------------------------------------
-- 106: lab bridge + outcomes
-- Before 106: outcome_links MISSING; assessment_id column may be MISSING;
--             partial unique index MISSING.
-- After 106: all PRESENT.
-- ---------------------------------------------------------------------------
SELECT
  CASE
    WHEN to_regclass('public.lab_submissions') IS NULL THEN 'MISSING'
    ELSE 'PRESENT'
  END AS lab_submissions_status,
  to_regclass('public.lab_submissions') AS lab_submissions_table;

SELECT
  CASE
    WHEN to_regclass('public.assessment_outcome_links') IS NULL THEN 'MISSING_BEFORE_106_OR_NOT_APPLIED'
    ELSE 'PRESENT'
  END AS assessment_outcome_links_status,
  to_regclass('public.assessment_outcome_links') AS outcome_links_table;

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = 'assessment_outcome_links_assessment_outcome_null_criterion_uidx'
    ) THEN 'PRESENT'
    ELSE 'MISSING_BEFORE_106_OR_NOT_APPLIED'
  END AS outcome_null_criterion_unique_index_status;

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'lab_submissions'
        AND column_name = 'assessment_id'
    ) THEN 'PRESENT'
    ELSE 'MISSING_BEFORE_106_OR_NOT_APPLIED'
  END AS lab_submissions_assessment_id_status;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'lab_submissions'
  AND column_name = 'assessment_id';

-- ---------------------------------------------------------------------------
-- Manual negative checks (run carefully with disposable IDs only)
-- ---------------------------------------------------------------------------
-- 1) Level points > criterion max_points should raise from
--    enforce_rubric_level_points_within_criterion.
-- 2) criterion score with level_id from another criterion should raise from
--    enforce_criterion_score_integrity.
-- 3) lab_submissions.assessment_id pointing at another course should raise from
--    enforce_lab_submission_assessment_same_course.
-- 4) resubmit_practical_submission on non-returned status should raise.
-- 5) mark_practical_submission with mismatched p_expected_status should raise.
