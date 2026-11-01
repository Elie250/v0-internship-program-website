-- Interactive lessons: structured body, lesson visibility, modules.
-- Additive / idempotent. Existing URL lessons stay published and ungrouped.
-- Run in Supabase SQL Editor after scripts/94-webinar-thumbnails.sql.

CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS course_modules_course_sort_idx
  ON course_modules (course_id, sort_order);

ALTER TABLE course_content
  ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES course_modules(id) ON DELETE SET NULL;

ALTER TABLE course_content
  ADD COLUMN IF NOT EXISTS body JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE course_content
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'published';

UPDATE course_content
SET visibility = 'published'
WHERE visibility IS NULL OR visibility NOT IN ('draft', 'published');

ALTER TABLE course_content DROP CONSTRAINT IF EXISTS course_content_visibility_check;
ALTER TABLE course_content
  ADD CONSTRAINT course_content_visibility_check
  CHECK (visibility IN ('draft', 'published'));

ALTER TABLE course_content DROP CONSTRAINT IF EXISTS course_content_content_type_check;
ALTER TABLE course_content
  ADD CONSTRAINT course_content_content_type_check
  CHECK (content_type IN (
    'video',
    'webinar',
    'pdf',
    'document',
    'link',
    'download',
    'interactive'
  ));

CREATE INDEX IF NOT EXISTS course_content_course_visibility_idx
  ON course_content (course_id, visibility);

CREATE INDEX IF NOT EXISTS course_content_module_sort_idx
  ON course_content (module_id, sort_order);

COMMENT ON TABLE course_modules IS 'Optional lesson groups for a course. Phase 3 UI.';
COMMENT ON COLUMN course_content.body IS 'Ordered JSON lesson blocks. Empty array for URL-only lessons.';
COMMENT ON COLUMN course_content.visibility IS 'draft is lecturer/admin only. published is visible to admitted students.';

ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_course_content" ON course_content;
CREATE POLICY "public_read_published_course_content" ON course_content FOR SELECT USING (
  COALESCE(visibility, 'published') = 'published'
  AND EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = course_content.course_id
      AND c.status = 'published'
  )
);

NOTIFY pgrst, 'reload schema';
