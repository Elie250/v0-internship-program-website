-- Program types: training, internship, mentorship, career_guidance, workshop, webinar, event
-- Run in Supabase SQL editor after scripts 11 and 13.

ALTER TABLE courses ADD COLUMN IF NOT EXISTS program_type TEXT NOT NULL DEFAULT 'training';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS meeting_link TEXT;

UPDATE courses SET program_type = 'training' WHERE program_type IS NULL OR program_type = '';

CREATE INDEX IF NOT EXISTS idx_courses_program_type ON courses (program_type);
CREATE INDEX IF NOT EXISTS idx_courses_status_program_type ON courses (status, program_type);

-- Optional: sync company phone in site settings
UPDATE site_settings SET value = '+250783986252' WHERE key = 'company_phone';

NOTIFY pgrst, 'reload schema';
