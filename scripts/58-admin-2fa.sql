-- Optional TOTP two-factor authentication for admin accounts
-- Run after scripts/57-admin-audit-log.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT false;

NOTIFY pgrst, 'reload schema';
