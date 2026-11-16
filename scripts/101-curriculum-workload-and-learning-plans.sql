-- Curriculum workload metadata + daily learning-plan templates.
-- Additive / idempotent. Does not alter enrollments, payments, sessions, or progress.
-- Run in Supabase SQL Editor after scripts/100-enrollment-package-snapshot.sql.
-- Application-layer authorization is still required: supabaseAdmin bypasses RLS.

-- ---------------------------------------------------------------------------
-- Lesson / assessment workload metadata
-- ---------------------------------------------------------------------------

ALTER TABLE course_content
  ADD COLUMN IF NOT EXISTS estimated_minutes INT;

ALTER TABLE course_content
  ADD COLUMN IF NOT EXISTS activity_kind TEXT;

ALTER TABLE course_content DROP CONSTRAINT IF EXISTS course_content_estimated_minutes_check;
ALTER TABLE course_content
  ADD CONSTRAINT course_content_estimated_minutes_check
  CHECK (estimated_minutes IS NULL OR estimated_minutes > 0);

ALTER TABLE course_content DROP CONSTRAINT IF EXISTS course_content_activity_kind_check;
ALTER TABLE course_content
  ADD CONSTRAINT course_content_activity_kind_check
  CHECK (
    activity_kind IS NULL
    OR activity_kind IN ('theory', 'practical', 'exercise', 'project', 'assessment')
  );

ALTER TABLE course_assessments
  ADD COLUMN IF NOT EXISTS estimated_minutes INT;

ALTER TABLE course_assessments
  ADD COLUMN IF NOT EXISTS activity_kind TEXT;

ALTER TABLE course_assessments DROP CONSTRAINT IF EXISTS course_assessments_estimated_minutes_check;
ALTER TABLE course_assessments
  ADD CONSTRAINT course_assessments_estimated_minutes_check
  CHECK (estimated_minutes IS NULL OR estimated_minutes > 0);

ALTER TABLE course_assessments DROP CONSTRAINT IF EXISTS course_assessments_activity_kind_check;
ALTER TABLE course_assessments
  ADD CONSTRAINT course_assessments_activity_kind_check
  CHECK (
    activity_kind IS NULL
    OR activity_kind IN ('theory', 'practical', 'exercise', 'project', 'assessment')
  );

COMMENT ON COLUMN course_content.estimated_minutes IS
  'Admin/lecturer-authored estimated learning minutes. Never inferred from body or media length.';
COMMENT ON COLUMN course_content.activity_kind IS
  'Curriculum activity classification for learning-plan mapping.';
COMMENT ON COLUMN course_assessments.estimated_minutes IS
  'Admin/lecturer-authored estimated assessment minutes. Never inferred.';
COMMENT ON COLUMN course_assessments.activity_kind IS
  'Usually assessment; may be project when configured.';

-- ---------------------------------------------------------------------------
-- Learning-plan templates (course-level recommended day sequences)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS course_learning_plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  revision INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  CONSTRAINT course_learning_plan_templates_status_check
    CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE UNIQUE INDEX IF NOT EXISTS course_learning_plan_templates_one_draft_idx
  ON course_learning_plan_templates (course_id)
  WHERE status = 'draft';

CREATE INDEX IF NOT EXISTS course_learning_plan_templates_course_status_idx
  ON course_learning_plan_templates (course_id, status, revision DESC);

CREATE TABLE IF NOT EXISTS course_learning_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES course_learning_plan_templates(id) ON DELETE CASCADE,
  day_index INT NOT NULL,
  title TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT course_learning_plan_days_day_index_check CHECK (day_index >= 1),
  CONSTRAINT course_learning_plan_days_unique_day UNIQUE (template_id, day_index)
);

CREATE INDEX IF NOT EXISTS course_learning_plan_days_template_idx
  ON course_learning_plan_days (template_id, day_index);

CREATE TABLE IF NOT EXISTS course_learning_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES course_learning_plan_days(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_id UUID NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  -- Explicit minutes for this day when an activity is split across days.
  portion_minutes INT,
  -- Links portions of the same activity across days.
  span_group_id UUID,
  -- Frozen on publish; historically stable for published revisions.
  snapshot_minutes INT,
  snapshot_activity_kind TEXT,
  CONSTRAINT course_learning_plan_items_activity_type_check
    CHECK (activity_type IN ('lesson', 'assessment')),
  CONSTRAINT course_learning_plan_items_portion_check
    CHECK (portion_minutes IS NULL OR portion_minutes > 0),
  CONSTRAINT course_learning_plan_items_snapshot_minutes_check
    CHECK (snapshot_minutes IS NULL OR snapshot_minutes > 0),
  CONSTRAINT course_learning_plan_items_snapshot_kind_check
    CHECK (
      snapshot_activity_kind IS NULL
      OR snapshot_activity_kind IN ('theory', 'practical', 'exercise', 'project', 'assessment')
    )
);

CREATE INDEX IF NOT EXISTS course_learning_plan_items_day_idx
  ON course_learning_plan_items (day_id, sort_order);

CREATE INDEX IF NOT EXISTS course_learning_plan_items_activity_idx
  ON course_learning_plan_items (activity_type, activity_id);

CREATE INDEX IF NOT EXISTS course_learning_plan_items_span_idx
  ON course_learning_plan_items (span_group_id)
  WHERE span_group_id IS NOT NULL;

ALTER TABLE course_learning_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_learning_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_learning_plan_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "course_learning_plan_templates_no_direct_access" ON course_learning_plan_templates;
CREATE POLICY "course_learning_plan_templates_no_direct_access"
  ON course_learning_plan_templates FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "course_learning_plan_days_no_direct_access" ON course_learning_plan_days;
CREATE POLICY "course_learning_plan_days_no_direct_access"
  ON course_learning_plan_days FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "course_learning_plan_items_no_direct_access" ON course_learning_plan_items;
CREATE POLICY "course_learning_plan_items_no_direct_access"
  ON course_learning_plan_items FOR ALL USING (false) WITH CHECK (false);

COMMENT ON TABLE course_learning_plan_templates IS
  'Course-level recommended daily learning sequences. Draft edits are not student schedules; publish freezes activity snapshots for Phase 2 enrollment schedules.';
COMMENT ON TABLE course_learning_plan_days IS
  'Ordered recommended learning days (1-based day_index). Future student schedules anchor day 1 to admission date using consecutive calendar days.';
COMMENT ON TABLE course_learning_plan_items IS
  'Curriculum activity placements. Source lesson/assessment IDs are preserved; snapshot_* columns freeze workload metadata on publish.';

NOTIFY pgrst, 'reload schema';
