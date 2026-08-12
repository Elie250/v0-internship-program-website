-- Phase 1: Energy & Logics Recruitment / Talent Platform foundation
-- Multi-tenant organizations, memberships, candidate profiles, passwordless login tokens, audit log
-- Does NOT modify Academy/course assessment tables.
-- Run in Supabase SQL Editor after existing migrations.

-- ---------------------------------------------------------------------------
-- Organizations (tenants)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  careers_blurb TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'suspended')),
  notification_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT recruitment_organizations_slug_format
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE UNIQUE INDEX IF NOT EXISTS recruitment_organizations_slug_uidx
  ON recruitment_organizations (lower(slug));

CREATE INDEX IF NOT EXISTS recruitment_organizations_status_idx
  ON recruitment_organizations (status);

-- ---------------------------------------------------------------------------
-- Organization memberships (org-scoped roles)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL
    CHECK (role IN ('organization_admin', 'hr_recruiter', 'hiring_manager')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('invited', 'active', 'suspended', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS recruitment_org_memberships_user_idx
  ON recruitment_organization_memberships (user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS recruitment_org_memberships_org_idx
  ON recruitment_organization_memberships (organization_id, status);

-- ---------------------------------------------------------------------------
-- Organization invites (email invite to join an org)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL
    CHECK (role IN ('organization_admin', 'hr_recruiter', 'hiring_manager')),
  token_hash TEXT NOT NULL,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recruitment_org_invites_org_idx
  ON recruitment_organization_invites (organization_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS recruitment_org_invites_token_uidx
  ON recruitment_organization_invites (token_hash)
  WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- Candidate profile (belongs to USER, not to an organization)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_candidate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  headline TEXT,
  phone TEXT,
  location TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  summary TEXT,
  consent_privacy_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recruitment_candidate_profiles_user_idx
  ON recruitment_candidate_profiles (user_id);

-- ---------------------------------------------------------------------------
-- Passwordless login tokens (magic link) — recruitment entry
-- Does not replace Academy password login.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_login_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recruitment_login_tokens_email_idx
  ON recruitment_login_tokens (lower(email), created_at DESC);

-- ---------------------------------------------------------------------------
-- Recruitment audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES recruitment_organizations(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recruitment_audit_logs_org_idx
  ON recruitment_audit_logs (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_audit_logs_actor_idx
  ON recruitment_audit_logs (actor_user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- RLS: deny public/anon; server uses service role
-- ---------------------------------------------------------------------------
ALTER TABLE recruitment_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_login_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_public_recruitment_organizations" ON recruitment_organizations;
CREATE POLICY "deny_public_recruitment_organizations" ON recruitment_organizations
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_org_memberships" ON recruitment_organization_memberships;
CREATE POLICY "deny_public_recruitment_org_memberships" ON recruitment_organization_memberships
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_org_invites" ON recruitment_organization_invites;
CREATE POLICY "deny_public_recruitment_org_invites" ON recruitment_organization_invites
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_candidate_profiles" ON recruitment_candidate_profiles;
CREATE POLICY "deny_public_recruitment_candidate_profiles" ON recruitment_candidate_profiles
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_login_tokens" ON recruitment_login_tokens;
CREATE POLICY "deny_public_recruitment_login_tokens" ON recruitment_login_tokens
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_audit_logs" ON recruitment_audit_logs;
CREATE POLICY "deny_public_recruitment_audit_logs" ON recruitment_audit_logs
  FOR ALL USING (false);

-- ---------------------------------------------------------------------------
-- Seed first tenant as ordinary organization DATA (not hardcoded in app logic)
-- ---------------------------------------------------------------------------
INSERT INTO recruitment_organizations (name, slug, description, status, careers_blurb)
SELECT
  'EasyFab',
  'easyfab',
  'EasyFab — first employer organization on the Energy & Logics Talent platform.',
  'active',
  'Join EasyFab engineering teams. Applications and screening run on Energy & Logics Talent.'
WHERE NOT EXISTS (
  SELECT 1 FROM recruitment_organizations WHERE lower(slug) = 'easyfab'
);

NOTIFY pgrst, 'reload schema';
