-- 03-extend-registrations-table.sql
-- Extends registrations with application-form fields.
-- Safe on a fresh DB: creates the base table if it does not exist yet.

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

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS national_id_passport VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_province VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_district VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_sector VARCHAR(100),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS field_of_study VARCHAR(255),
  ADD COLUMN IF NOT EXISTS current_level VARCHAR(50),
  ADD COLUMN IF NOT EXISTS year_of_study VARCHAR(50),
  ADD COLUMN IF NOT EXISTS preferred_duration VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sponsorship_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS sponsor_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS sponsor_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS sponsor_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS sponsor_relationship VARCHAR(100),
  ADD COLUMN IF NOT EXISTS parent_guardian_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS parent_guardian_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS parent_guardian_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS motivation TEXT,
  ADD COLUMN IF NOT EXISTS agreement_confirmed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS certificate_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS registration_status VARCHAR(50) DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS profession VARCHAR(255),
  ADD COLUMN IF NOT EXISTS training_program VARCHAR(255),
  ADD COLUMN IF NOT EXISTS schedule VARCHAR(255),
  ADD COLUMN IF NOT EXISTS registration_type VARCHAR(50) DEFAULT 'Student Internship';

CREATE INDEX IF NOT EXISTS registrations_email_idx ON registrations (email);
CREATE INDEX IF NOT EXISTS registrations_created_at_idx ON registrations (created_at DESC);
CREATE INDEX IF NOT EXISTS registrations_registration_status_idx ON registrations (registration_status);
CREATE INDEX IF NOT EXISTS registrations_program_idx ON registrations (program);
CREATE INDEX IF NOT EXISTS registrations_type_idx ON registrations (registration_type);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_registrations" ON registrations;
CREATE POLICY "public_insert_registrations" ON registrations
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "public_select_registrations" ON registrations;
CREATE POLICY "public_select_registrations" ON registrations
  FOR SELECT
  USING (true);
