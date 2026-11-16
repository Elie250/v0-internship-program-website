-- Phase C1: practical assessment kinds, delivery mode, structured brief.
-- Additive / idempotent. Does not alter enrollments, payments, certificates, or quiz attempt data.
-- Run in Supabase SQL Editor after scripts/103-curriculum-outcomes-and-module-authoring.sql
-- (103 is required before 106 outcome links; this script only needs course_assessments).
-- Application-layer authorization is still required: supabaseAdmin bypasses RLS.
--
-- Deferred to C2: module_id on course_assessments.

ALTER TABLE course_assessments
  ADD COLUMN IF NOT EXISTS assessment_kind TEXT;

ALTER TABLE course_assessments
  ADD COLUMN IF NOT EXISTS delivery_mode TEXT;

ALTER TABLE course_assessments
  ADD COLUMN IF NOT EXISTS practical_brief JSONB;

-- Backfill existing rows as quizzes (safe to re-run).
UPDATE course_assessments
SET assessment_kind = 'quiz'
WHERE assessment_kind IS NULL OR BTRIM(assessment_kind) = '';

UPDATE course_assessments
SET delivery_mode = 'not_applicable'
WHERE assessment_kind = 'quiz'
  AND (delivery_mode IS NULL OR BTRIM(delivery_mode) = '');

UPDATE course_assessments
SET delivery_mode = 'virtual_software'
WHERE assessment_kind IN ('laboratory', 'practical_task', 'project', 'final_practical')
  AND (delivery_mode IS NULL OR BTRIM(delivery_mode) = '');

ALTER TABLE course_assessments
  ALTER COLUMN assessment_kind SET DEFAULT 'quiz';

ALTER TABLE course_assessments
  ALTER COLUMN delivery_mode SET DEFAULT 'not_applicable';

ALTER TABLE course_assessments
  ALTER COLUMN assessment_kind SET NOT NULL;

ALTER TABLE course_assessments
  ALTER COLUMN delivery_mode SET NOT NULL;

ALTER TABLE course_assessments DROP CONSTRAINT IF EXISTS course_assessments_assessment_kind_check;
ALTER TABLE course_assessments
  ADD CONSTRAINT course_assessments_assessment_kind_check
  CHECK (
    assessment_kind IN (
      'quiz',
      'laboratory',
      'practical_task',
      'project',
      'final_practical'
    )
  );

ALTER TABLE course_assessments DROP CONSTRAINT IF EXISTS course_assessments_delivery_mode_check;
ALTER TABLE course_assessments
  ADD CONSTRAINT course_assessments_delivery_mode_check
  CHECK (
    delivery_mode IN (
      'not_applicable',
      'virtual_software',
      'physical_lab',
      'hybrid'
    )
  );

ALTER TABLE course_assessments DROP CONSTRAINT IF EXISTS course_assessments_kind_delivery_check;
ALTER TABLE course_assessments
  ADD CONSTRAINT course_assessments_kind_delivery_check
  CHECK (
    (assessment_kind = 'quiz' AND delivery_mode = 'not_applicable')
    OR (
      assessment_kind IN ('laboratory', 'practical_task', 'project', 'final_practical')
      AND delivery_mode IN ('virtual_software', 'physical_lab', 'hybrid')
    )
  );

CREATE INDEX IF NOT EXISTS course_assessments_course_kind_idx
  ON course_assessments (course_id, assessment_kind, sort_order, id);

COMMENT ON COLUMN course_assessments.assessment_kind IS
  'quiz | laboratory | practical_task | project | final_practical';
COMMENT ON COLUMN course_assessments.delivery_mode IS
  'Quizzes use not_applicable. C1 practicals use virtual_software; physical_lab/hybrid reserved for later.';
COMMENT ON COLUMN course_assessments.practical_brief IS
  'Versioned JSON brief (v1): learning_objectives, prerequisites, required/optional/alternative_software, instructions, expected_results, simulation_requirements, submission_requirements, documentation_requirements, safety_notes, delivery_notes. safety_notes ≠ delivery_notes. Validated in application layer; null for quizzes.';

NOTIFY pgrst, 'reload schema';
