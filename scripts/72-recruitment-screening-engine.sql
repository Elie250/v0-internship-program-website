-- Phase 4: Energy & Logics Talent — Technical Screening Engine
-- Server-authoritative sessions, materialized questions, answers, scoring
-- Run after scripts/71-recruitment-employer-platform.sql
-- Does NOT modify Academy/course assessment tables.
-- Does NOT implement AI grading or integrity bands (Phase 5+).

-- ---------------------------------------------------------------------------
-- Extend screening configs for publish + section thresholds
-- ---------------------------------------------------------------------------
ALTER TABLE recruitment_screening_configs
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS section_minimums JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS max_attempts INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_screening_configs_status_check'
  ) THEN
    ALTER TABLE recruitment_screening_configs
      ADD CONSTRAINT recruitment_screening_configs_status_check
      CHECK (status IN ('draft', 'published'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Extend question bank for typed questions + dynamic parameters
-- ---------------------------------------------------------------------------
ALTER TABLE recruitment_questions
  ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'short_text',
  ADD COLUMN IF NOT EXISTS options JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS parameters JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS answer_spec JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS weight NUMERIC NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS section TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_questions_question_type_check'
  ) THEN
    ALTER TABLE recruitment_questions
      ADD CONSTRAINT recruitment_questions_question_type_check
      CHECK (question_type IN (
        'multiple_choice',
        'multiple_select',
        'numeric',
        'short_text'
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_questions_status_check'
  ) THEN
    ALTER TABLE recruitment_questions
      ADD CONSTRAINT recruitment_questions_status_check
      CHECK (status IN ('active', 'archived'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS recruitment_questions_type_section_idx
  ON recruitment_questions (question_type, section)
  WHERE status = 'active';

-- ---------------------------------------------------------------------------
-- Screening sessions (one attempt lifecycle per application policy)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_screening_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES recruitment_applications(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES recruitment_jobs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  candidate_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  screening_config_id UUID REFERENCES recruitment_screening_configs(id) ON DELETE SET NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN (
      'in_progress',
      'submitted',
      'expired',
      'cancelled'
    )),
  session_seed TEXT NOT NULL,
  config_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  consent_acknowledged_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  finalized_at TIMESTAMPTZ,
  technical_score NUMERIC,
  max_score NUMERIC,
  section_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  passed BOOLEAN,
  completion_state TEXT
    CHECK (completion_state IS NULL OR completion_state IN (
      'complete',
      'partial',
      'expired',
      'pending_manual'
    )),
  integrity_placeholder JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS recruitment_screening_sessions_active_uidx
  ON recruitment_screening_sessions (application_id)
  WHERE status = 'in_progress';

CREATE INDEX IF NOT EXISTS recruitment_screening_sessions_app_idx
  ON recruitment_screening_sessions (application_id, attempt_number DESC);

CREATE INDEX IF NOT EXISTS recruitment_screening_sessions_org_idx
  ON recruitment_screening_sessions (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_screening_sessions_candidate_idx
  ON recruitment_screening_sessions (candidate_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_screening_sessions_job_idx
  ON recruitment_screening_sessions (job_id, status);

-- ---------------------------------------------------------------------------
-- Immutable materialized session items (frozen question instances)
-- expected_answer / answer_expression stay server-only
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_session_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES recruitment_screening_sessions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  question_id UUID REFERENCES recruitment_questions(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  question_type TEXT NOT NULL
    CHECK (question_type IN (
      'multiple_choice',
      'multiple_select',
      'numeric',
      'short_text'
    )),
  section TEXT,
  category TEXT,
  difficulty TEXT,
  weight NUMERIC NOT NULL DEFAULT 1,
  expected_time_sec INTEGER,
  resolved_prompt TEXT NOT NULL,
  options_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  option_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  parameters_resolved JSONB NOT NULL DEFAULT '{}'::jsonb,
  expected_answer JSONB NOT NULL DEFAULT '{}'::jsonb,
  max_points NUMERIC NOT NULL DEFAULT 1,
  points_awarded NUMERIC,
  scoring_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (scoring_status IN (
      'pending',
      'correct',
      'incorrect',
      'partial',
      'pending_manual',
      'unanswered'
    )),
  opened_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  time_spent_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS recruitment_session_items_session_order_uidx
  ON recruitment_session_items (session_id, sort_order);

CREATE INDEX IF NOT EXISTS recruitment_session_items_session_idx
  ON recruitment_session_items (session_id);

CREATE INDEX IF NOT EXISTS recruitment_session_items_org_idx
  ON recruitment_session_items (organization_id);

-- ---------------------------------------------------------------------------
-- Answers (payload only; scoring on session_items)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_screening_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES recruitment_screening_sessions(id) ON DELETE CASCADE,
  session_item_id UUID NOT NULL REFERENCES recruitment_session_items(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  candidate_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answer_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_event_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_item_id)
);

CREATE INDEX IF NOT EXISTS recruitment_screening_answers_session_idx
  ON recruitment_screening_answers (session_id);

CREATE INDEX IF NOT EXISTS recruitment_screening_answers_org_idx
  ON recruitment_screening_answers (organization_id);

-- ---------------------------------------------------------------------------
-- Integrity event foundation (Phase 5) — ingest only, no scoring bands
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_screening_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES recruitment_screening_sessions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  candidate_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_event_at TIMESTAMPTZ,
  server_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recruitment_screening_events_session_idx
  ON recruitment_screening_events (session_id, server_received_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_screening_events_org_idx
  ON recruitment_screening_events (organization_id, server_received_at DESC);

-- ---------------------------------------------------------------------------
-- RLS deny-all (service-role server access only)
-- ---------------------------------------------------------------------------
ALTER TABLE recruitment_screening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_session_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_screening_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_screening_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_public_recruitment_screening_sessions" ON recruitment_screening_sessions;
CREATE POLICY "deny_public_recruitment_screening_sessions" ON recruitment_screening_sessions
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_session_items" ON recruitment_session_items;
CREATE POLICY "deny_public_recruitment_session_items" ON recruitment_session_items
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_screening_answers" ON recruitment_screening_answers;
CREATE POLICY "deny_public_recruitment_screening_answers" ON recruitment_screening_answers
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_screening_events" ON recruitment_screening_events;
CREATE POLICY "deny_public_recruitment_screening_events" ON recruitment_screening_events
  FOR ALL USING (false);

NOTIFY pgrst, 'reload schema';
