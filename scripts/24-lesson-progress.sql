-- Lesson progress tracking for student course player
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES course_content(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);

CREATE INDEX IF NOT EXISTS lesson_progress_user_course_idx ON lesson_progress (user_id, course_id);
CREATE INDEX IF NOT EXISTS lesson_progress_content_idx ON lesson_progress (content_id);

NOTIFY pgrst, 'reload schema';
