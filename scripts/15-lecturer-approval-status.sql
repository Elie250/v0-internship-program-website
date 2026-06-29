-- Lecturer / staff self-registration requires admin approval before login.
-- Run in Supabase SQL editor after scripts/00 and 13.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check
  CHECK (status IN ('active', 'inactive', 'suspended', 'pending_approval'));

CREATE INDEX IF NOT EXISTS idx_users_pending_lecturers
  ON users (role, status)
  WHERE status = 'pending_approval';

NOTIFY pgrst, 'reload schema';
