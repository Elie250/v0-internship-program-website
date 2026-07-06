-- Certificate approval flow: lecturer confirms -> admin gives final approval
-- Also allow free-course certificates (rendered with an "Energy & Logics" watermark)
-- Run in Supabase SQL Editor after scripts/27-quiz-assessments.sql

ALTER TABLE student_certificates ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'issued';
ALTER TABLE student_certificates ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE student_certificates ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE student_certificates ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- status values: 'pending_admin' (lecturer confirmed, awaiting admin) | 'issued'

NOTIFY pgrst, 'reload schema';
