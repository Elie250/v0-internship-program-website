-- Allow webinar lesson type on course_content
-- Run in Supabase SQL editor if adding webinar materials fails.

ALTER TABLE course_content DROP CONSTRAINT IF EXISTS course_content_content_type_check;

ALTER TABLE course_content ADD CONSTRAINT course_content_content_type_check
  CHECK (content_type IN ('video', 'webinar', 'pdf', 'document', 'link', 'download'));

NOTIFY pgrst, 'reload schema';
