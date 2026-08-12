-- Phase 3: Energy & Logics Talent — Employer / Partner Platform
-- Pipeline, HR notes, job extras, screening configuration, question bank foundation
-- Run after scripts/70-recruitment-candidate-platform.sql
-- Does NOT modify Academy/course assessment tables.
-- Does NOT implement candidate screening execution (Phase 4).

-- ---------------------------------------------------------------------------
-- Job extras (department, skills, salary, visibility)
-- ---------------------------------------------------------------------------
ALTER TABLE recruitment_jobs
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS salary_min NUMERIC,
  ADD COLUMN IF NOT EXISTS salary_max NUMERIC,
  ADD COLUMN IF NOT EXISTS salary_currency TEXT,
  ADD COLUMN IF NOT EXISTS salary_visible BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_jobs_visibility_check'
  ) THEN
    ALTER TABLE recruitment_jobs
      ADD CONSTRAINT recruitment_jobs_visibility_check
      CHECK (visibility IN ('public', 'unlisted'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Application pipeline statuses
-- ---------------------------------------------------------------------------
ALTER TABLE recruitment_applications
  DROP CONSTRAINT IF EXISTS recruitment_applications_status_check;

ALTER TABLE recruitment_applications
  ADD CONSTRAINT recruitment_applications_status_check
  CHECK (status IN (
    'submitted',
    'under_review',
    'screening',
    'shortlisted',
    'interview',
    'offer',
    'hired',
    'rejected',
    'withdrawn'
  ));

-- ---------------------------------------------------------------------------
-- Application status history (audit-friendly pipeline trail)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES recruitment_applications(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recruitment_app_status_history_app_idx
  ON recruitment_application_status_history (application_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_app_status_history_org_idx
  ON recruitment_application_status_history (organization_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Internal HR notes (never shown to candidates)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_application_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES recruitment_applications(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recruitment_app_notes_app_idx
  ON recruitment_application_notes (application_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_app_notes_org_idx
  ON recruitment_application_notes (organization_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Optional hiring-manager job assignments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES recruitment_jobs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, user_id)
);

CREATE INDEX IF NOT EXISTS recruitment_job_assignments_user_idx
  ON recruitment_job_assignments (organization_id, user_id);

-- ---------------------------------------------------------------------------
-- Screening configuration (data model + employer UI only; no execution engine)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_screening_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL UNIQUE REFERENCES recruitment_jobs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  duration_minutes INTEGER,
  question_count INTEGER,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  difficulty_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  passing_score INTEGER,
  passing_criteria TEXT,
  attempt_policy TEXT NOT NULL DEFAULT 'single'
    CHECK (attempt_policy IN ('single', 'retry_once', 'unlimited')),
  question_selection TEXT NOT NULL DEFAULT 'manual'
    CHECK (question_selection IN ('manual', 'random_from_bank', 'mixed')),
  randomized BOOLEAN NOT NULL DEFAULT true,
  dynamic_parameters BOOLEAN NOT NULL DEFAULT false,
  per_question_time_seconds INTEGER,
  integrity_monitoring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recruitment_screening_configs_org_idx
  ON recruitment_screening_configs (organization_id);

-- ---------------------------------------------------------------------------
-- Question bank foundation (platform-protected vs org-private)
-- answer_key is stored server-side; APIs must not leak platform keys to employers.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL
    CHECK (owner_type IN ('platform', 'organization')),
  organization_id UUID REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  discipline TEXT,
  difficulty TEXT
    CHECK (difficulty IS NULL OR difficulty IN ('easy', 'medium', 'hard')),
  prompt TEXT NOT NULL,
  expected_time_seconds INTEGER,
  answer_key TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT recruitment_questions_owner_org_chk CHECK (
    (owner_type = 'platform' AND organization_id IS NULL)
    OR (owner_type = 'organization' AND organization_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS recruitment_questions_org_idx
  ON recruitment_questions (organization_id, discipline)
  WHERE owner_type = 'organization';

CREATE INDEX IF NOT EXISTS recruitment_questions_platform_idx
  ON recruitment_questions (discipline)
  WHERE owner_type = 'platform';

-- Attach questions to a job screening config (selection only — no execution)
CREATE TABLE IF NOT EXISTS recruitment_job_screening_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES recruitment_jobs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES recruitment_questions(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, question_id)
);

CREATE INDEX IF NOT EXISTS recruitment_job_screening_items_job_idx
  ON recruitment_job_screening_items (job_id, sort_order);

-- ---------------------------------------------------------------------------
-- RLS deny-all (service-role server access only)
-- ---------------------------------------------------------------------------
ALTER TABLE recruitment_application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_screening_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_job_screening_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_public_recruitment_app_status_history" ON recruitment_application_status_history;
CREATE POLICY "deny_public_recruitment_app_status_history" ON recruitment_application_status_history
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_app_notes" ON recruitment_application_notes;
CREATE POLICY "deny_public_recruitment_app_notes" ON recruitment_application_notes
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_job_assignments" ON recruitment_job_assignments;
CREATE POLICY "deny_public_recruitment_job_assignments" ON recruitment_job_assignments
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_screening_configs" ON recruitment_screening_configs;
CREATE POLICY "deny_public_recruitment_screening_configs" ON recruitment_screening_configs
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_questions" ON recruitment_questions;
CREATE POLICY "deny_public_recruitment_questions" ON recruitment_questions
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_job_screening_items" ON recruitment_job_screening_items;
CREATE POLICY "deny_public_recruitment_job_screening_items" ON recruitment_job_screening_items
  FOR ALL USING (false);

NOTIFY pgrst, 'reload schema';
