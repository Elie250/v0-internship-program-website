-- Phase 9: Organization onboarding requests + invite email tracking helpers
-- Does NOT modify Academy tables. Does NOT alter migrations 68–76.
-- Run in Supabase SQL Editor after 76.

-- ---------------------------------------------------------------------------
-- Organization access / creation requests (Energy & Logics approval queue)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_organization_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES recruitment_organizations(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  suggested_slug TEXT,
  contact_email TEXT NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'new_organization'
    CHECK (request_type IN ('new_organization', 'access_existing')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  requester_notes TEXT,
  review_notes TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recruitment_org_requests_status_idx
  ON recruitment_organization_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_org_requests_requester_idx
  ON recruitment_organization_requests (requester_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_org_requests_org_idx
  ON recruitment_organization_requests (organization_id)
  WHERE organization_id IS NOT NULL;

-- At most one open pending new-organization request per user
CREATE UNIQUE INDEX IF NOT EXISTS recruitment_org_requests_pending_new_uidx
  ON recruitment_organization_requests (requester_user_id)
  WHERE status = 'pending' AND request_type = 'new_organization';

-- At most one open pending access-existing request per user
CREATE UNIQUE INDEX IF NOT EXISTS recruitment_org_requests_pending_access_uidx
  ON recruitment_organization_requests (requester_user_id)
  WHERE status = 'pending' AND request_type = 'access_existing';

ALTER TABLE recruitment_organization_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_public_recruitment_organization_requests"
  ON recruitment_organization_requests;
CREATE POLICY "deny_public_recruitment_organization_requests"
  ON recruitment_organization_requests
  FOR ALL USING (false);

COMMENT ON TABLE recruitment_organization_requests IS
  'Employer onboarding requests. Pending new_organization requires Energy & Logics approval before workspace access. access_existing waits for company-admin invite. Never trust client approval state.';
