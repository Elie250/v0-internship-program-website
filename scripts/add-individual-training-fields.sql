-- Add fields for individual professional training support
ALTER TABLE registrations 
  ADD COLUMN IF NOT EXISTS profession VARCHAR(255),
  ADD COLUMN IF NOT EXISTS training_program VARCHAR(255),
  ADD COLUMN IF NOT EXISTS schedule VARCHAR(255),
  ADD COLUMN IF NOT EXISTS registration_type VARCHAR(50) DEFAULT 'Student Internship';

-- Create index on registration_type for filtering
CREATE INDEX IF NOT EXISTS registrations_type_idx ON registrations(registration_type);

-- Update RLS policies to allow admin queries on registration_type
ALTER POLICY "public_select_registrations" ON registrations USING (true);
