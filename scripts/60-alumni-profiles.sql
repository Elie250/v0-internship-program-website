-- Public alumni profiles for graduates
-- Run after scripts/59-mentor-matching.sql

CREATE TABLE IF NOT EXISTS alumni_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  programme_title TEXT,
  graduation_year INT,
  headline TEXT,
  bio TEXT,
  linkedin_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alumni_profiles_public_idx
  ON alumni_profiles (is_public, graduation_year DESC)
  WHERE is_public = true;

NOTIFY pgrst, 'reload schema';
