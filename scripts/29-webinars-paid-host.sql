-- Webinars: admin-managed public webinars can be paid/free and assigned to a host
-- (a lecturer or engineer account). Lecturer course webinars stay inside
-- course_content and are NOT affected by this table.
-- Run in Supabase SQL Editor. Safe / idempotent.

ALTER TABLE webinars ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS host_user_id UUID;
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS host_name TEXT;
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS host_role TEXT;
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Free webinars must have a zero price.
UPDATE webinars SET price = 0 WHERE is_paid = false;

-- The public read policy already exposes published webinars; no change needed.
