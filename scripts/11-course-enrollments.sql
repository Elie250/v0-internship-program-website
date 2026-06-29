-- Course enrollments + link payments to courses
-- Run after scripts/04-engineering-hub-platform.sql and scripts/07-manual-payment-verification.sql

CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  motivation TEXT,
  amount_due NUMERIC(10, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'payment_pending_review',
  payment_id UUID,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS course_enrollments_course_id_idx ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS course_enrollments_status_idx ON course_enrollments(status);
CREATE INDEX IF NOT EXISTS course_enrollments_created_at_idx ON course_enrollments(created_at DESC);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS course_enrollment_id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS course_id UUID;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_enrollments') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'payments_course_enrollment_id_fkey'
    ) THEN
      ALTER TABLE payments
        ADD CONSTRAINT payments_course_enrollment_id_fkey
        FOREIGN KEY (course_enrollment_id) REFERENCES course_enrollments(id) ON DELETE SET NULL;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS program TEXT;
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN;
    UPDATE courses SET is_published = (status = 'published') WHERE is_published IS NULL AND status IS NOT NULL;
    UPDATE courses SET status = CASE WHEN is_published THEN 'published' ELSE 'draft' END
      WHERE status IS NULL AND is_published IS NOT NULL;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
