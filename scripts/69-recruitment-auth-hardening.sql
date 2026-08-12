-- Phase 1 hardening: IP-scoped rate limiting for passwordless auth
-- Run after scripts/68-recruitment-foundation.sql

ALTER TABLE recruitment_login_tokens
  ADD COLUMN IF NOT EXISTS request_ip_hash TEXT;

CREATE INDEX IF NOT EXISTS recruitment_login_tokens_ip_hash_created_idx
  ON recruitment_login_tokens (request_ip_hash, created_at DESC)
  WHERE request_ip_hash IS NOT NULL;

NOTIFY pgrst, 'reload schema';
