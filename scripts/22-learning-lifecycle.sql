-- Learning lifecycle: rejection reasons, assessments, certificates
-- Run in Supabase SQL editor.

ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE TABLE IF NOT EXISTS course_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER NOT NULL DEFAULT 70,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES course_assessments(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  score INTEGER,
  passed BOOLEAN NOT NULL DEFAULT false,
  lecturer_approved BOOLEAN NOT NULL DEFAULT false,
  admin_confirmed BOOLEAN NOT NULL DEFAULT false,
  lecturer_notes TEXT,
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, enrollment_id)
);

CREATE TABLE IF NOT EXISTS student_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_code TEXT NOT NULL UNIQUE,
  student_name TEXT NOT NULL,
  program_title TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS course_assessments_course_idx ON course_assessments (course_id, sort_order);
CREATE INDEX IF NOT EXISTS assessment_submissions_enrollment_idx ON assessment_submissions (enrollment_id);
CREATE INDEX IF NOT EXISTS student_certificates_user_idx ON student_certificates (user_id);

NOTIFY pgrst, 'reload schema';
