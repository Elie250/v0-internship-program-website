-- Public team profiles on About Us (lecturers / staff opt in)
-- Run in Supabase SQL Editor after scripts/13-enrollment-access-and-user-link.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_title TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_on_team BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_show_on_team ON users (show_on_team)
  WHERE show_on_team = true;
