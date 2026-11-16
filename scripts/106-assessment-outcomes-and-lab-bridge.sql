-- Phase C1: assessment↔outcome mapping + non-destructive lab_submissions bridge.
-- REQUIRES scripts/103-curriculum-outcomes-and-module-authoring.sql (curriculum_learning_outcomes).
-- Run after scripts/105-assessment-rubrics-and-scores.sql.
-- Does not auto-assign historical lab rows to assessments.

CREATE TABLE IF NOT EXISTS assessment_outcome_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES course_assessments(id) ON DELETE CASCADE,
  outcome_id UUID NOT NULL REFERENCES curriculum_learning_outcomes(id) ON DELETE CASCADE,
  criterion_id UUID REFERENCES assessment_rubric_criteria(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT assessment_outcome_links_unique UNIQUE (assessment_id, outcome_id, criterion_id)
);

-- Partial unique for assessment-level links (criterion_id IS NULL).
CREATE UNIQUE INDEX IF NOT EXISTS assessment_outcome_links_assessment_outcome_null_criterion_uidx
  ON assessment_outcome_links (assessment_id, outcome_id)
  WHERE criterion_id IS NULL;

CREATE INDEX IF NOT EXISTS assessment_outcome_links_assessment_idx
  ON assessment_outcome_links (assessment_id);

CREATE INDEX IF NOT EXISTS assessment_outcome_links_outcome_idx
  ON assessment_outcome_links (outcome_id);

CREATE OR REPLACE FUNCTION enforce_assessment_outcome_same_course()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_assessment_course UUID;
  v_outcome_course UUID;
BEGIN
  SELECT course_id INTO v_assessment_course
  FROM course_assessments
  WHERE id = NEW.assessment_id;

  SELECT course_id INTO v_outcome_course
  FROM curriculum_learning_outcomes
  WHERE id = NEW.outcome_id;

  IF v_assessment_course IS NULL OR v_outcome_course IS NULL THEN
    RAISE EXCEPTION 'Assessment and outcome must exist';
  END IF;

  IF v_assessment_course <> v_outcome_course THEN
    RAISE EXCEPTION 'Outcome must belong to the same course as the assessment';
  END IF;

  IF NEW.criterion_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM assessment_rubric_criteria c
      JOIN assessment_rubrics r ON r.id = c.rubric_id
      WHERE c.id = NEW.criterion_id
        AND r.assessment_id = NEW.assessment_id
    ) THEN
      RAISE EXCEPTION 'Criterion must belong to the assessment rubric';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assessment_outcome_same_course ON assessment_outcome_links;
CREATE TRIGGER trg_assessment_outcome_same_course
  BEFORE INSERT OR UPDATE ON assessment_outcome_links
  FOR EACH ROW
  EXECUTE PROCEDURE enforce_assessment_outcome_same_course();

ALTER TABLE lab_submissions
  ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES course_assessments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS lab_submissions_assessment_idx
  ON lab_submissions (assessment_id)
  WHERE assessment_id IS NOT NULL;

-- When linking a legacy lab submission to an assessment, courses must match.
-- Does not auto-link or modify historical NULL assessment_id rows.
CREATE OR REPLACE FUNCTION enforce_lab_submission_assessment_same_course()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_assessment_course UUID;
BEGIN
  IF NEW.assessment_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT course_id INTO v_assessment_course
  FROM course_assessments
  WHERE id = NEW.assessment_id;

  IF v_assessment_course IS NULL THEN
    RAISE EXCEPTION 'Linked assessment % does not exist', NEW.assessment_id;
  END IF;

  IF NEW.course_id IS DISTINCT FROM v_assessment_course THEN
    RAISE EXCEPTION 'lab_submissions.assessment_id must belong to the same course as lab_submissions.course_id';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lab_submission_assessment_same_course ON lab_submissions;
CREATE TRIGGER trg_lab_submission_assessment_same_course
  BEFORE INSERT OR UPDATE OF assessment_id, course_id ON lab_submissions
  FOR EACH ROW
  EXECUTE PROCEDURE enforce_lab_submission_assessment_same_course();

ALTER TABLE assessment_outcome_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assessment_outcome_links_no_direct_access" ON assessment_outcome_links;
CREATE POLICY "assessment_outcome_links_no_direct_access"
  ON assessment_outcome_links FOR ALL TO public USING (false) WITH CHECK (false);

COMMENT ON TABLE assessment_outcome_links IS
  'Maps course_assessments to curriculum_learning_outcomes. Optional criterion_id for finer mapping.';
COMMENT ON COLUMN lab_submissions.assessment_id IS
  'Optional link to a practical assessment. Historical rows stay NULL until manually linked.';
COMMENT ON FUNCTION enforce_lab_submission_assessment_same_course() IS
  'When assessment_id is set, it must reference a course_assessments row on the same course_id. Does not auto-link history.';

-- Verification (run manually; do not apply from CI):
-- SELECT to_regclass('public.curriculum_learning_outcomes') AS outcomes_table;
-- SELECT conname FROM pg_constraint
--   WHERE conrelid = 'public.curriculum_learning_outcomes'::regclass AND contype = 'p';
-- Expected: outcomes_table = curriculum_learning_outcomes and a primary-key constraint exists
-- (from scripts/103-curriculum-outcomes-and-module-authoring.sql).

NOTIFY pgrst, 'reload schema';
