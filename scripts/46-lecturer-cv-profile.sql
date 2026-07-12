-- Lecturer / staff CV profile fields
-- Run in Supabase SQL Editor after scripts/42-team-profiles.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_education TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_experience TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_qualifications TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_cv_url TEXT;

NOTIFY pgrst, 'reload schema';
