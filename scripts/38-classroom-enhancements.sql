-- Classroom enhancements: attendance, lab submissions, Q&A, session reminders
-- Run in Supabase SQL Editor after scripts/37-announcement-creators.sql

CREATE TABLE IF NOT EXISTS course_session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'excused')),
  marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  self_checked_in BOOLEAN NOT NULL DEFAULT false,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, enrollment_id)
);

CREATE INDEX IF NOT EXISTS course_session_attendance_session_idx
  ON course_session_attendance (session_id);

CREATE TABLE IF NOT EXISTS lab_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES course_content(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'resubmit')),
  lecturer_feedback TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lab_submissions_course_idx ON lab_submissions (course_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lab_submissions_enrollment_idx ON lab_submissions (enrollment_id);

CREATE TABLE IF NOT EXISTS course_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  answered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS course_questions_course_idx ON course_questions (course_id, created_at DESC);

CREATE TABLE IF NOT EXISTS session_reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES course_sessions(id) ON DELETE CASCADE,
  webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '1h')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS session_reminder_log_session_type_idx
  ON session_reminder_log (session_id, reminder_type)
  WHERE session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS session_reminder_log_webinar_type_idx
  ON session_reminder_log (webinar_id, reminder_type)
  WHERE webinar_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
