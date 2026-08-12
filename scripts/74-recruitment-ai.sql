-- Phase 6: Energy & Logics Talent — AI-Assisted Recruitment Analysis (advisory only)
-- Run after scripts/73-recruitment-screening-integrity.sql
-- Does NOT modify Academy tables.
-- Does NOT overwrite technical_score, integrity_band, answers, or integrity events.

CREATE TABLE IF NOT EXISTS recruitment_ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES recruitment_applications(id) ON DELETE CASCADE,
  session_id UUID REFERENCES recruitment_screening_sessions(id) ON DELETE SET NULL,
  answer_id UUID REFERENCES recruitment_screening_answers(id) ON DELETE SET NULL,
  analysis_type TEXT NOT NULL
    CHECK (analysis_type IN (
      'application_advisory',
      'cv_profile_summary',
      'open_answer_review',
      'technical_performance_summary',
      'integrity_context_summary',
      'interview_suggestions'
    )),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',
      'analyzing',
      'available',
      'failed',
      'cancelled'
    )),
  provider TEXT NOT NULL DEFAULT 'openai',
  model TEXT,
  prompt_version TEXT NOT NULL,
  input_reference_version TEXT NOT NULL,
  input_digest TEXT,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recruitment_ai_analyses_org_app_idx
  ON recruitment_ai_analyses (organization_id, application_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_ai_analyses_session_idx
  ON recruitment_ai_analyses (session_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS recruitment_ai_analyses_status_idx
  ON recruitment_ai_analyses (organization_id, status, created_at DESC);

ALTER TABLE recruitment_ai_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_public_recruitment_ai_analyses" ON recruitment_ai_analyses;
CREATE POLICY "deny_public_recruitment_ai_analyses" ON recruitment_ai_analyses
  FOR ALL USING (false);

NOTIFY pgrst, 'reload schema';
