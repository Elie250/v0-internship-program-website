-- Create users table (required for /auth/login)
-- Run this BEFORE scripts/05-seed-admin-user.sql if login fails

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student' CHECK (
    role IN ('student', 'registered', 'mentor', 'lecturer', 'instructor', 'engineer', 'support_staff', 'admin')
  ),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (lower(email));
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- No public access to users table (auth uses service role server-side)
DROP POLICY IF EXISTS "deny_public_users_select" ON users;
CREATE POLICY "deny_public_users_select" ON users FOR SELECT USING (false);

DROP POLICY IF EXISTS "deny_public_users_insert" ON users;
CREATE POLICY "deny_public_users_insert" ON users FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "deny_public_users_update" ON users;
CREATE POLICY "deny_public_users_update" ON users FOR UPDATE USING (false);

DROP POLICY IF EXISTS "deny_public_users_delete" ON users;
CREATE POLICY "deny_public_users_delete" ON users FOR DELETE USING (false);
