-- Extend registrations table with additional fields for comprehensive application form
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
  ADD COLUMN IF NOT EXISTS agreement_confirmed BOOLEAN DEFAULT FALSE;

-- Add certificate_generated field if it doesn't exist (might already be there)
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS certificate_generated BOOLEAN DEFAULT FALSE;

-- Add status field for tracking application progress
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS registration_status VARCHAR(50) DEFAULT 'Pending' DEFAULT 'Pending';

-- Create index on registration_status for filtering
CREATE INDEX IF NOT EXISTS registrations_registration_status_idx ON registrations(registration_status);

-- Create index on program for better filtering
CREATE INDEX IF NOT EXISTS registrations_program_idx ON registrations(program);
