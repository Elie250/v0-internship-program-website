-- Mentor matching requests from career page
-- Run after scripts/58-admin-2fa.sql

CREATE TABLE IF NOT EXISTS mentor_match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  focus_area TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'matched', 'closed')),
  matched_mentor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mentor_match_requests_status_idx
  ON mentor_match_requests (status, created_at DESC);

NOTIFY pgrst, 'reload schema';
