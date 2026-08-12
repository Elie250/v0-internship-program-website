-- Phase 7: Energy & Logics Talent — Employer Operations & Interview Workflow
-- Run after scripts/74-recruitment-ai.sql
-- Does NOT modify Academy tables.
-- Does NOT change technical_score / integrity_band authority.

-- ---------------------------------------------------------------------------
-- Interviews
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES recruitment_jobs(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES recruitment_applications(id) ON DELETE CASCADE,
  candidate_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL DEFAULT 'online'
    CHECK (interview_type IN ('in_person', 'online', 'phone')),
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN (
      'scheduled',
      'rescheduled',
      'completed',
      'cancelled',
      'no_show'
    )),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  timezone TEXT,
  location TEXT,
  meeting_url TEXT,
  candidate_instructions TEXT,
  internal_notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recruitment_interviews_org_idx
  ON recruitment_interviews (organization_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_interviews_app_idx
  ON recruitment_interviews (application_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_interviews_candidate_idx
  ON recruitment_interviews (candidate_user_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_interviews_job_idx
  ON recruitment_interviews (job_id, status, scheduled_at);

-- ---------------------------------------------------------------------------
-- Interview scorecards / evaluations (advisory — never auto-hire)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_interview_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES recruitment_interviews(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES recruitment_applications(id) ON DELETE CASCADE,
  interviewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  criteria_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  overall_rating NUMERIC,
  recommendation TEXT
    CHECK (recommendation IS NULL OR recommendation IN (
      'strong_yes',
      'yes',
      'neutral',
      'no',
      'strong_no'
    )),
  feedback TEXT,
  private_notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted')),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (interview_id, interviewer_user_id)
);

CREATE INDEX IF NOT EXISTS recruitment_interview_evaluations_org_idx
  ON recruitment_interview_evaluations (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_interview_evaluations_app_idx
  ON recruitment_interview_evaluations (application_id);

-- ---------------------------------------------------------------------------
-- Notification events (email/in-app prep — no spam)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES recruitment_organizations(id) ON DELETE SET NULL,
  application_id UUID REFERENCES recruitment_applications(id) ON DELETE SET NULL,
  interview_id UUID REFERENCES recruitment_interviews(id) ON DELETE SET NULL,
  recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_email TEXT,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email'
    CHECK (channel IN ('email', 'in_app', 'both')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS recruitment_notification_events_org_idx
  ON recruitment_notification_events (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_notification_events_recipient_idx
  ON recruitment_notification_events (recipient_user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- RLS deny-all (service-role server access only)
-- ---------------------------------------------------------------------------
ALTER TABLE recruitment_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_interview_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_notification_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_public_recruitment_interviews" ON recruitment_interviews;
CREATE POLICY "deny_public_recruitment_interviews" ON recruitment_interviews
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_interview_evaluations" ON recruitment_interview_evaluations;
CREATE POLICY "deny_public_recruitment_interview_evaluations" ON recruitment_interview_evaluations
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_notification_events" ON recruitment_notification_events;
CREATE POLICY "deny_public_recruitment_notification_events" ON recruitment_notification_events
  FOR ALL USING (false);

NOTIFY pgrst, 'reload schema';
