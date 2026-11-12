-- Phase A: structured curriculum outcomes, module authoring integrity, drip helpers support.
-- Additive / idempotent. Does not alter enrollments, payments, access windows, certificates, or progress.
-- Run in Supabase SQL Editor after scripts/102-learning-plan-publish-integrity.sql.
-- Application-layer authorization is still required: supabaseAdmin bypasses RLS.
--
-- ---------------------------------------------------------------------------
-- Module FK / ON DELETE SET NULL (critical)
-- ---------------------------------------------------------------------------
-- PostgreSQL/Supabase (PG15): ON DELETE SET NULL on a COMPOSITE foreign key
-- nulls EVERY column in the FK. A composite FK
--   (module_id, course_id) REFERENCES course_modules(id, course_id) ON DELETE SET NULL
-- would attempt to null course_content.course_id as well — unsafe and rejected
-- when course_id is NOT NULL.
--
-- Therefore we KEEP the single-column FK:
--   module_id REFERENCES course_modules(id) ON DELETE SET NULL
-- so deleting a module only sets course_content.module_id = NULL and leaves
-- course_content.course_id unchanged (lesson stays on the same course, ungrouped).
--
-- Same-course membership is enforced with a BEFORE INSERT/UPDATE trigger below,
-- not with a composite ON DELETE SET NULL FK.
-- ---------------------------------------------------------------------------

-- Composite uniqueness so outcomes can FK (entity_id, course_id) safely.
CREATE UNIQUE INDEX IF NOT EXISTS course_modules_id_course_uidx
  ON course_modules (id, course_id);

CREATE UNIQUE INDEX IF NOT EXISTS course_content_id_course_uidx
  ON course_content (id, course_id);

-- Reaffirm single-column module FK with ON DELETE SET NULL (idempotent recreate).
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'course_content'
    AND con.contype = 'f'
    AND pg_get_constraintdef(con.oid) ILIKE '%module_id%course_modules%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE course_content DROP CONSTRAINT %I', constraint_name);
  END IF;

  ALTER TABLE course_content
    ADD CONSTRAINT course_content_module_id_fkey
    FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- already present with desired name
END $$;

CREATE OR REPLACE FUNCTION enforce_lesson_module_same_course()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.module_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM course_modules m
    WHERE m.id = NEW.module_id
      AND m.course_id = NEW.course_id
  ) THEN
    RAISE EXCEPTION 'module_id must belong to the same course as the lesson';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS course_content_module_same_course ON course_content;
CREATE TRIGGER course_content_module_same_course
  BEFORE INSERT OR UPDATE OF module_id, course_id ON course_content
  FOR EACH ROW
  EXECUTE PROCEDURE enforce_lesson_module_same_course();

COMMENT ON FUNCTION enforce_lesson_module_same_course() IS
  'Ensures course_content.module_id points at a module in the same course. Deletion still uses single-column ON DELETE SET NULL so only module_id is cleared.';

-- ---------------------------------------------------------------------------
-- Structured learning outcomes (brochure TEXT on course_report_profiles unchanged)
-- ---------------------------------------------------------------------------
-- programme = top-level aims of the offering (courses row as programme shell)
-- course    = finer assessable CLOs for this taught course
-- module    = module-level outcomes (module_id required, same course via composite FK)
-- lesson    = lesson-level objectives (content_id required, same course via composite FK)

CREATE TABLE IF NOT EXISTS curriculum_learning_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  module_id UUID,
  content_id UUID,
  code TEXT,
  statement TEXT NOT NULL,
  success_criteria TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT curriculum_learning_outcomes_scope_check
    CHECK (scope IN ('programme', 'course', 'module', 'lesson')),
  CONSTRAINT curriculum_learning_outcomes_statement_check
    CHECK (BTRIM(statement) <> ''),
  CONSTRAINT curriculum_learning_outcomes_sort_order_check
    CHECK (sort_order >= 0),
  CONSTRAINT curriculum_learning_outcomes_scope_shape_check
    CHECK (
      (scope IN ('programme', 'course') AND module_id IS NULL AND content_id IS NULL)
      OR (scope = 'module' AND module_id IS NOT NULL AND content_id IS NULL)
      OR (scope = 'lesson' AND content_id IS NOT NULL AND module_id IS NULL)
    ),
  CONSTRAINT curriculum_learning_outcomes_module_course_fkey
    FOREIGN KEY (module_id, course_id)
    REFERENCES course_modules (id, course_id)
    ON DELETE CASCADE,
  CONSTRAINT curriculum_learning_outcomes_content_course_fkey
    FOREIGN KEY (content_id, course_id)
    REFERENCES course_content (id, course_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS curriculum_learning_outcomes_course_scope_idx
  ON curriculum_learning_outcomes (course_id, scope, sort_order, id);

CREATE INDEX IF NOT EXISTS curriculum_learning_outcomes_module_idx
  ON curriculum_learning_outcomes (module_id)
  WHERE module_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS curriculum_learning_outcomes_content_idx
  ON curriculum_learning_outcomes (content_id)
  WHERE content_id IS NOT NULL;

ALTER TABLE curriculum_learning_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "curriculum_learning_outcomes_no_direct_access" ON curriculum_learning_outcomes;
CREATE POLICY "curriculum_learning_outcomes_no_direct_access"
  ON curriculum_learning_outcomes
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE curriculum_learning_outcomes IS
  'Structured measurable outcomes. Separate from course_report_profiles brochure TEXT. programme vs course scopes are both course_id-scoped; module/lesson rows use composite FKs for same-course integrity.';
COMMENT ON COLUMN curriculum_learning_outcomes.scope IS
  'programme = offering-level PLOs; course = CLOs; module/lesson = nested outcomes.';

COMMENT ON TABLE course_modules IS
  'Lesson groups for a course. Phase A authoring UI. Deleting a module SET NULLs lesson.module_id only.';

NOTIFY pgrst, 'reload schema';
