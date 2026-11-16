-- Phase C1: rubrics, criterion scores, practical submission fields, artifacts.
-- Run after scripts/104-practical-assessments-core.sql.
-- Does not modify quiz attempt scoring columns. Application-layer auth still required.

CREATE TABLE IF NOT EXISTS assessment_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES course_assessments(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Marking rubric',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT assessment_rubrics_assessment_uidx UNIQUE (assessment_id),
  CONSTRAINT assessment_rubrics_title_check CHECK (char_length(BTRIM(title)) > 0)
);

CREATE TABLE IF NOT EXISTS assessment_rubric_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id UUID NOT NULL REFERENCES assessment_rubrics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  max_points NUMERIC(8, 2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT assessment_rubric_criteria_title_check CHECK (char_length(BTRIM(title)) > 0),
  CONSTRAINT assessment_rubric_criteria_max_points_check CHECK (max_points > 0),
  CONSTRAINT assessment_rubric_criteria_sort_order_check CHECK (sort_order >= 0)
);

CREATE INDEX IF NOT EXISTS assessment_rubric_criteria_rubric_idx
  ON assessment_rubric_criteria (rubric_id, sort_order, id);

CREATE TABLE IF NOT EXISTS assessment_rubric_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criterion_id UUID NOT NULL REFERENCES assessment_rubric_criteria(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  points NUMERIC(8, 2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT assessment_rubric_levels_label_check CHECK (char_length(BTRIM(label)) > 0),
  CONSTRAINT assessment_rubric_levels_points_check CHECK (points >= 0),
  CONSTRAINT assessment_rubric_levels_sort_order_check CHECK (sort_order >= 0)
);

CREATE INDEX IF NOT EXISTS assessment_rubric_levels_criterion_idx
  ON assessment_rubric_levels (criterion_id, sort_order, id);

-- Level points cannot exceed the parent criterion max_points (enforced by trigger;
-- CHECK cannot reference another table).
CREATE OR REPLACE FUNCTION enforce_rubric_level_points_within_criterion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_max NUMERIC(8, 2);
BEGIN
  SELECT max_points INTO v_max
  FROM assessment_rubric_criteria
  WHERE id = NEW.criterion_id;

  IF v_max IS NULL THEN
    RAISE EXCEPTION 'Rubric criterion % does not exist', NEW.criterion_id;
  END IF;

  IF NEW.points > v_max THEN
    RAISE EXCEPTION 'Level points (%) may not exceed criterion max_points (%)', NEW.points, v_max;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rubric_level_points_within_criterion ON assessment_rubric_levels;
CREATE TRIGGER trg_rubric_level_points_within_criterion
  BEFORE INSERT OR UPDATE OF points, criterion_id ON assessment_rubric_levels
  FOR EACH ROW
  EXECUTE PROCEDURE enforce_rubric_level_points_within_criterion();

-- When criterion max_points is lowered, existing levels must still fit.
CREATE OR REPLACE FUNCTION enforce_criterion_max_covers_levels()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_bad NUMERIC(8, 2);
BEGIN
  IF NEW.max_points <= 0 THEN
    RAISE EXCEPTION 'Criterion max_points must be positive';
  END IF;

  SELECT points INTO v_bad
  FROM assessment_rubric_levels
  WHERE criterion_id = NEW.id
    AND points > NEW.max_points
  LIMIT 1;

  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'Criterion max_points (%) is below an existing level (%)', NEW.max_points, v_bad;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_criterion_max_covers_levels ON assessment_rubric_criteria;
CREATE TRIGGER trg_criterion_max_covers_levels
  BEFORE UPDATE OF max_points ON assessment_rubric_criteria
  FOR EACH ROW
  EXECUTE PROCEDURE enforce_criterion_max_covers_levels();

ALTER TABLE assessment_submissions
  ADD COLUMN IF NOT EXISTS practical_status TEXT;

ALTER TABLE assessment_submissions
  ADD COLUMN IF NOT EXISTS student_notes TEXT;

ALTER TABLE assessment_submissions
  ADD COLUMN IF NOT EXISTS feedback_summary TEXT;

ALTER TABLE assessment_submissions
  ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;

ALTER TABLE assessment_submissions
  ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE assessment_submissions
  ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;

ALTER TABLE assessment_submissions
  ADD COLUMN IF NOT EXISTS practical_percent NUMERIC(6, 2);

ALTER TABLE assessment_submissions DROP CONSTRAINT IF EXISTS assessment_submissions_practical_status_check;
ALTER TABLE assessment_submissions
  ADD CONSTRAINT assessment_submissions_practical_status_check
  CHECK (
    practical_status IS NULL
    OR practical_status IN ('draft', 'submitted', 'returned', 'resubmitted', 'graded')
  );

CREATE TABLE IF NOT EXISTS assessment_submission_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES assessment_submissions(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  byte_size INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL DEFAULT '',
  storage_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT assessment_submission_artifacts_file_url_check CHECK (char_length(BTRIM(file_url)) > 0),
  CONSTRAINT assessment_submission_artifacts_file_name_check CHECK (char_length(BTRIM(file_name)) > 0),
  CONSTRAINT assessment_submission_artifacts_byte_size_check CHECK (byte_size >= 0),
  CONSTRAINT assessment_submission_artifacts_sort_order_check CHECK (sort_order >= 0)
);

CREATE INDEX IF NOT EXISTS assessment_submission_artifacts_submission_idx
  ON assessment_submission_artifacts (submission_id, sort_order, id);

CREATE TABLE IF NOT EXISTS assessment_criterion_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES assessment_submissions(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES assessment_rubric_criteria(id) ON DELETE CASCADE,
  level_id UUID REFERENCES assessment_rubric_levels(id) ON DELETE SET NULL,
  points_awarded NUMERIC(8, 2) NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT assessment_criterion_scores_points_check CHECK (points_awarded >= 0),
  CONSTRAINT assessment_criterion_scores_unique UNIQUE (submission_id, criterion_id)
);

CREATE INDEX IF NOT EXISTS assessment_criterion_scores_submission_idx
  ON assessment_criterion_scores (submission_id);

-- level_id (when set) must belong to the same criterion as criterion_id;
-- points_awarded must not exceed the criterion max_points;
-- criterion must belong to the submission's assessment rubric.
CREATE OR REPLACE FUNCTION enforce_criterion_score_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_max NUMERIC(8, 2);
  v_level_criterion UUID;
  v_assessment UUID;
  v_rubric_assessment UUID;
BEGIN
  SELECT max_points, r.assessment_id
  INTO v_max, v_rubric_assessment
  FROM assessment_rubric_criteria c
  JOIN assessment_rubrics r ON r.id = c.rubric_id
  WHERE c.id = NEW.criterion_id;

  IF v_max IS NULL THEN
    RAISE EXCEPTION 'Criterion % does not exist', NEW.criterion_id;
  END IF;

  IF NEW.points_awarded > v_max THEN
    RAISE EXCEPTION 'points_awarded (%) exceeds criterion max_points (%)', NEW.points_awarded, v_max;
  END IF;

  SELECT assessment_id INTO v_assessment
  FROM assessment_submissions
  WHERE id = NEW.submission_id;

  IF v_assessment IS NULL THEN
    RAISE EXCEPTION 'Submission % does not exist', NEW.submission_id;
  END IF;

  IF v_assessment <> v_rubric_assessment THEN
    RAISE EXCEPTION 'Criterion does not belong to the submission assessment rubric';
  END IF;

  IF NEW.level_id IS NOT NULL THEN
    SELECT criterion_id INTO v_level_criterion
    FROM assessment_rubric_levels
    WHERE id = NEW.level_id;

    IF v_level_criterion IS NULL THEN
      RAISE EXCEPTION 'Level % does not exist', NEW.level_id;
    END IF;

    IF v_level_criterion <> NEW.criterion_id THEN
      RAISE EXCEPTION 'level_id must belong to the same criterion as criterion_id';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_criterion_score_integrity ON assessment_criterion_scores;
CREATE TRIGGER trg_criterion_score_integrity
  BEFORE INSERT OR UPDATE ON assessment_criterion_scores
  FOR EACH ROW
  EXECUTE PROCEDURE enforce_criterion_score_integrity();

ALTER TABLE assessment_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_rubric_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_rubric_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_submission_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_criterion_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assessment_rubrics_no_direct_access" ON assessment_rubrics;
CREATE POLICY "assessment_rubrics_no_direct_access"
  ON assessment_rubrics FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "assessment_rubric_criteria_no_direct_access" ON assessment_rubric_criteria;
CREATE POLICY "assessment_rubric_criteria_no_direct_access"
  ON assessment_rubric_criteria FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "assessment_rubric_levels_no_direct_access" ON assessment_rubric_levels;
CREATE POLICY "assessment_rubric_levels_no_direct_access"
  ON assessment_rubric_levels FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "assessment_submission_artifacts_no_direct_access" ON assessment_submission_artifacts;
CREATE POLICY "assessment_submission_artifacts_no_direct_access"
  ON assessment_submission_artifacts FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "assessment_criterion_scores_no_direct_access" ON assessment_criterion_scores;
CREATE POLICY "assessment_criterion_scores_no_direct_access"
  ON assessment_criterion_scores FOR ALL TO public USING (false) WITH CHECK (false);

COMMENT ON TABLE assessment_rubrics IS
  'One marking rubric per practical assessment. Quizzes do not use this table.';
COMMENT ON COLUMN assessment_submissions.practical_status IS
  'Null for quiz submissions. Practical workflow: draft|submitted|returned|resubmitted|graded.';
COMMENT ON COLUMN assessment_submission_artifacts.storage_key IS
  'Trusted object key under assessment-submissions/{courseId}/{assessmentId}/{userId}/. Prefer over public file_url.';
COMMENT ON FUNCTION enforce_criterion_score_integrity() IS
  'Ensures criterion scores reference the submission rubric and that level_id matches criterion_id.';

-- Atomic returned → resubmitted: clear criterion scores + grade fields in one transaction.
CREATE OR REPLACE FUNCTION resubmit_practical_submission(
  p_submission_id UUID,
  p_student_notes TEXT DEFAULT NULL
)
RETURNS assessment_submissions
LANGUAGE plpgsql
AS $$
DECLARE
  v_row assessment_submissions;
  v_updated INTEGER;
BEGIN
  SELECT * INTO v_row
  FROM assessment_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  IF v_row.practical_status IS DISTINCT FROM 'returned' THEN
    RAISE EXCEPTION 'Submission must be returned before resubmit (found %)', v_row.practical_status;
  END IF;

  DELETE FROM assessment_criterion_scores
  WHERE submission_id = p_submission_id;

  UPDATE assessment_submissions
  SET
    student_notes = COALESCE(p_student_notes, student_notes),
    practical_status = 'resubmitted',
    submitted_at = now(),
    updated_at = now(),
    score = NULL,
    passed = false,
    practical_percent = NULL,
    graded_at = NULL,
    graded_by = NULL,
    feedback_summary = NULL,
    returned_at = NULL
  WHERE id = p_submission_id
    AND practical_status = 'returned'
  RETURNING * INTO v_row;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> 1 THEN
    RAISE EXCEPTION 'Concurrent modification: expected exactly one returned submission to become resubmitted';
  END IF;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION resubmit_practical_submission(UUID, TEXT) IS
  'Atomically clears prior marks and moves a returned practical submission to resubmitted.';

-- Atomic lecturer mark / return: lock submission before writing criterion scores.
-- p_criterion_scores: JSON array of
--   { "criterion_id": uuid, "level_id": uuid|null, "points_awarded": number, "comment": text }
CREATE OR REPLACE FUNCTION mark_practical_submission(
  p_submission_id UUID,
  p_expected_status TEXT,
  p_next_status TEXT,
  p_grader_user_id UUID,
  p_feedback_summary TEXT,
  p_percent NUMERIC,
  p_passed BOOLEAN,
  p_criterion_scores JSONB
)
RETURNS assessment_submissions
LANGUAGE plpgsql
AS $$
DECLARE
  v_row assessment_submissions;
  v_updated INTEGER;
  v_item JSONB;
BEGIN
  IF p_next_status NOT IN ('returned', 'graded') THEN
    RAISE EXCEPTION 'Invalid mark target status %', p_next_status;
  END IF;

  IF p_criterion_scores IS NULL OR jsonb_typeof(p_criterion_scores) <> 'array' THEN
    RAISE EXCEPTION 'criterion scores must be a JSON array';
  END IF;

  -- Allowed lecturer transitions (must match application assertPracticalTransition).
  IF NOT (
    (p_expected_status = 'submitted' AND p_next_status IN ('returned', 'graded'))
    OR (p_expected_status = 'resubmitted' AND p_next_status IN ('returned', 'graded'))
    OR (p_expected_status = 'graded' AND p_next_status IN ('returned', 'graded'))
    OR (p_expected_status = 'returned' AND p_next_status IN ('returned', 'graded'))
  ) THEN
    RAISE EXCEPTION 'Invalid practical status transition (% → %) for lecturer',
      p_expected_status, p_next_status;
  END IF;

  SELECT * INTO v_row
  FROM assessment_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  IF v_row.practical_status IS DISTINCT FROM p_expected_status THEN
    RAISE EXCEPTION 'Submission status changed concurrently (expected %, found %)',
      p_expected_status, v_row.practical_status;
  END IF;

  DELETE FROM assessment_criterion_scores
  WHERE submission_id = p_submission_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_criterion_scores)
  LOOP
    INSERT INTO assessment_criterion_scores (
      submission_id,
      criterion_id,
      level_id,
      points_awarded,
      comment,
      updated_at
    ) VALUES (
      p_submission_id,
      (v_item->>'criterion_id')::UUID,
      NULLIF(v_item->>'level_id', '')::UUID,
      (v_item->>'points_awarded')::NUMERIC,
      COALESCE(v_item->>'comment', ''),
      now()
    );
  END LOOP;

  UPDATE assessment_submissions
  SET
    practical_status = p_next_status,
    feedback_summary = p_feedback_summary,
    practical_percent = p_percent,
    score = p_percent,
    passed = p_passed,
    graded_by = p_grader_user_id,
    graded_at = CASE WHEN p_next_status = 'graded' THEN now() ELSE NULL END,
    returned_at = CASE WHEN p_next_status = 'returned' THEN now() ELSE NULL END,
    updated_at = now()
  WHERE id = p_submission_id
    AND practical_status = p_expected_status
  RETURNING * INTO v_row;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> 1 THEN
    RAISE EXCEPTION 'Concurrent modification: expected exactly one submission row to be marked';
  END IF;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION mark_practical_submission(UUID, TEXT, TEXT, UUID, TEXT, NUMERIC, BOOLEAN, JSONB) IS
  'Atomically locks a practical submission, replaces criterion scores, and applies grade/return status.';

NOTIFY pgrst, 'reload schema';
