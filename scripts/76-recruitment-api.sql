-- Phase 8: Energy & Logics Talent — External Employer API & Integration Platform
-- Run after scripts/75-recruitment-interviews.sql
-- Does NOT modify Academy tables.
-- Does NOT weaken screening / integrity / HR decision authority.

-- ---------------------------------------------------------------------------
-- API credentials (service accounts) — secrets stored hashed only
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_id TEXT NOT NULL UNIQUE,
  secret_hash TEXT NOT NULL,
  secret_prefix TEXT NOT NULL,
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'revoked')),
  -- organization = org-wide integration; restricted = optional job allow-list
  access_mode TEXT NOT NULL DEFAULT 'organization'
    CHECK (access_mode IN ('organization', 'restricted')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recruitment_api_credentials_org_idx
  ON recruitment_api_credentials (organization_id, status);

CREATE INDEX IF NOT EXISTS recruitment_api_credentials_key_idx
  ON recruitment_api_credentials (key_id);

-- Optional job allow-list for restricted credentials
CREATE TABLE IF NOT EXISTS recruitment_api_credential_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES recruitment_api_credentials(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES recruitment_jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (credential_id, job_id)
);

CREATE INDEX IF NOT EXISTS recruitment_api_credential_jobs_cred_idx
  ON recruitment_api_credential_jobs (credential_id);

-- ---------------------------------------------------------------------------
-- Webhooks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  -- Signing secret kept server-side only (RLS deny-all). Shown once at create/rotate.
  signing_secret TEXT NOT NULL,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'revoked')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  last_delivery_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recruitment_webhooks_org_idx
  ON recruitment_webhooks (organization_id, status);

CREATE TABLE IF NOT EXISTS recruitment_webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  webhook_id UUID NOT NULL REFERENCES recruitment_webhooks(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'delivered', 'failed', 'abandoned')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ,
  last_http_status INTEGER,
  last_error TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (webhook_id, event_id)
);

CREATE INDEX IF NOT EXISTS recruitment_webhook_deliveries_org_idx
  ON recruitment_webhook_deliveries (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_webhook_deliveries_pending_idx
  ON recruitment_webhook_deliveries (status, next_attempt_at);

-- ---------------------------------------------------------------------------
-- API audit + rate limiting
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_api_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES recruitment_organizations(id) ON DELETE SET NULL,
  credential_id UUID REFERENCES recruitment_api_credentials(id) ON DELETE SET NULL,
  request_id TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  resource_type TEXT,
  resource_id TEXT,
  error_code TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recruitment_api_audit_logs_org_idx
  ON recruitment_api_audit_logs (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_api_audit_logs_cred_idx
  ON recruitment_api_audit_logs (credential_id, created_at DESC);

CREATE TABLE IF NOT EXISTS recruitment_api_rate_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES recruitment_api_credentials(id) ON DELETE CASCADE,
  bucket_key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bucket_key, window_start)
);

CREATE INDEX IF NOT EXISTS recruitment_api_rate_buckets_lookup_idx
  ON recruitment_api_rate_buckets (bucket_key, window_start);

-- ---------------------------------------------------------------------------
-- RLS deny-all (service-role server access only)
-- ---------------------------------------------------------------------------
ALTER TABLE recruitment_api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_api_credential_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_api_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_api_rate_buckets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_public_recruitment_api_credentials" ON recruitment_api_credentials;
CREATE POLICY "deny_public_recruitment_api_credentials" ON recruitment_api_credentials
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_api_credential_jobs" ON recruitment_api_credential_jobs;
CREATE POLICY "deny_public_recruitment_api_credential_jobs" ON recruitment_api_credential_jobs
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_webhooks" ON recruitment_webhooks;
CREATE POLICY "deny_public_recruitment_webhooks" ON recruitment_webhooks
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_webhook_deliveries" ON recruitment_webhook_deliveries;
CREATE POLICY "deny_public_recruitment_webhook_deliveries" ON recruitment_webhook_deliveries
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_api_audit_logs" ON recruitment_api_audit_logs;
CREATE POLICY "deny_public_recruitment_api_audit_logs" ON recruitment_api_audit_logs
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_api_rate_buckets" ON recruitment_api_rate_buckets;
CREATE POLICY "deny_public_recruitment_api_rate_buckets" ON recruitment_api_rate_buckets
  FOR ALL USING (false);

NOTIFY pgrst, 'reload schema';
