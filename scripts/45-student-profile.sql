-- Student profile: parent/guardian contact + profile photo (photo column shared with team profiles)
-- Run in Supabase SQL Editor after scripts/42-team-profiles.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_guardian_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_guardian_phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_guardian_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_guardian_relationship TEXT;

NOTIFY pgrst, 'reload schema';
