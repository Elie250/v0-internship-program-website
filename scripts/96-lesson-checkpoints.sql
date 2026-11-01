-- In-lesson checkpoint progress. Additive / idempotent.
-- Does not change course_content, lesson_progress, or quiz tables.
-- Run in Supabase SQL Editor after scripts/95-lesson-blocks-and-modules.sql.
-- Application-layer authorization is still required: supabaseAdmin bypasses RLS.

CREATE TABLE IF NOT EXISTS lesson_checkpoint_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES course_content(id) ON DELETE CASCADE,
  block_id TEXT NOT NULL,
  passed_at TIMESTAMPTZ,
  attempt_count INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, content_id, block_id)
);

CREATE INDEX IF NOT EXISTS lesson_checkpoint_progress_user_content_idx
  ON lesson_checkpoint_progress (user_id, content_id);

CREATE INDEX IF NOT EXISTS lesson_checkpoint_progress_content_idx
  ON lesson_checkpoint_progress (content_id);

ALTER TABLE lesson_checkpoint_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_checkpoint_progress_no_direct_access" ON lesson_checkpoint_progress;
CREATE POLICY "lesson_checkpoint_progress_no_direct_access"
  ON lesson_checkpoint_progress
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE lesson_checkpoint_progress IS
  'Server-enforced in-lesson checkpoint attempts. Students never read this table directly.';

NOTIFY pgrst, 'reload schema';
