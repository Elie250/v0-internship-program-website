-- Editorial programme report copy. Additive / idempotent.
-- Does not change courses, enrollments, lessons, or payments.
-- Run in Supabase SQL Editor after scripts/96-lesson-checkpoints.sql.
-- Application-layer authorization is still required: supabaseAdmin bypasses RLS.

CREATE TABLE IF NOT EXISTS course_report_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL UNIQUE REFERENCES courses(id) ON DELETE CASCADE,
  overview TEXT,
  purpose TEXT,
  target_audience TEXT,
  entry_requirements TEXT,
  learning_objectives TEXT,
  learning_outcomes TEXT,
  delivery_method TEXT,
  workload_description TEXT,
  assessment_description TEXT,
  certification_description TEXT,
  additional_information TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Writers set updated_at in application code. This project does not use
  -- updated_at triggers (same convention as scripts/96-lesson-checkpoints.sql).
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- course_id UNIQUE already creates an index. Drop a redundant index from an earlier draft.
DROP INDEX IF EXISTS course_report_profiles_course_idx;

ALTER TABLE course_report_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "course_report_profiles_no_direct_access" ON course_report_profiles;
CREATE POLICY "course_report_profiles_no_direct_access"
  ON course_report_profiles
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE course_report_profiles IS
  'Admin-supplied programme brochure text. Students read it only through the server report loader.';

NOTIFY pgrst, 'reload schema';
