-- 01-create-registrations-table.sql
-- Run AFTER 00-create-users-table.sql and BEFORE 03-extend-registrations-table.sql
-- Creates the internship/application registrations table (safe to re-run).

CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  school VARCHAR(255),
  program VARCHAR(255),
  level VARCHAR(50),
  duration VARCHAR(50),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS registrations_email_idx ON registrations (email);
CREATE INDEX IF NOT EXISTS registrations_created_at_idx ON registrations (created_at DESC);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_registrations" ON registrations;
CREATE POLICY "public_insert_registrations" ON registrations
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "public_select_registrations" ON registrations;
CREATE POLICY "public_select_registrations" ON registrations
  FOR SELECT
  USING (true);
