-- Phase 2: Energy & Logics Talent — Candidate Platform
-- Jobs, applications, documents, expanded candidate profiles
-- Run after scripts/68-recruitment-foundation.sql and 69-recruitment-auth-hardening.sql
-- Does NOT modify Academy/course assessment tables.

-- ---------------------------------------------------------------------------
-- Expand candidate profiles (candidate-owned, not org-owned)
-- ---------------------------------------------------------------------------
ALTER TABLE recruitment_candidate_profiles
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS education JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS experience JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- Jobs (belongs to exactly one organization)
-- Public URL: /o/{org_slug}/jobs/{job_slug}
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  responsibilities TEXT,
  requirements TEXT,
  qualifications TEXT,
  location TEXT,
  employment_type TEXT
    CHECK (employment_type IS NULL OR employment_type IN (
      'full_time', 'part_time', 'contract', 'internship', 'temporary'
    )),
  work_mode TEXT
    CHECK (work_mode IS NULL OR work_mode IN ('on_site', 'remote', 'hybrid')),
  category TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  published_at TIMESTAMPTZ,
  application_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT recruitment_jobs_slug_format
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS recruitment_jobs_org_status_idx
  ON recruitment_jobs (organization_id, status);

CREATE INDEX IF NOT EXISTS recruitment_jobs_published_idx
  ON recruitment_jobs (status, published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS recruitment_jobs_deadline_idx
  ON recruitment_jobs (application_deadline)
  WHERE application_deadline IS NOT NULL;

CREATE INDEX IF NOT EXISTS recruitment_jobs_location_idx
  ON recruitment_jobs (location)
  WHERE location IS NOT NULL;

CREATE INDEX IF NOT EXISTS recruitment_jobs_category_idx
  ON recruitment_jobs (category)
  WHERE category IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Candidate documents (private — CV etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID,
  document_type TEXT NOT NULL DEFAULT 'cv'
    CHECK (document_type IN ('cv', 'cover_letter', 'other')),
  storage_key TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  scan_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (scan_status IN ('pending', 'clean', 'rejected', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS recruitment_documents_candidate_idx
  ON recruitment_documents (candidate_user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS recruitment_documents_application_idx
  ON recruitment_documents (application_id)
  WHERE application_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Applications (one candidate per job; snapshot at submission)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES recruitment_jobs(id) ON DELETE CASCADE,
  candidate_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'under_review', 'shortlisted', 'rejected', 'withdrawn')),
  cv_document_id UUID REFERENCES recruitment_documents(id) ON DELETE SET NULL,
  profile_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate active applications for the same job/candidate
CREATE UNIQUE INDEX IF NOT EXISTS recruitment_applications_active_job_candidate_uidx
  ON recruitment_applications (job_id, candidate_user_id)
  WHERE status NOT IN ('withdrawn', 'rejected');

CREATE INDEX IF NOT EXISTS recruitment_applications_candidate_idx
  ON recruitment_applications (candidate_user_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_applications_job_idx
  ON recruitment_applications (job_id, status);

-- Link documents to applications after applications table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'recruitment_documents_application_id_fkey'
  ) THEN
    ALTER TABLE recruitment_documents
      ADD CONSTRAINT recruitment_documents_application_id_fkey
      FOREIGN KEY (application_id) REFERENCES recruitment_applications(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- RLS: deny public/anon (same strategy as Phase 1)
-- ---------------------------------------------------------------------------
ALTER TABLE recruitment_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_public_recruitment_jobs" ON recruitment_jobs;
CREATE POLICY "deny_public_recruitment_jobs" ON recruitment_jobs
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_documents" ON recruitment_documents;
CREATE POLICY "deny_public_recruitment_documents" ON recruitment_documents
  FOR ALL USING (false);

DROP POLICY IF EXISTS "deny_public_recruitment_applications" ON recruitment_applications;
CREATE POLICY "deny_public_recruitment_applications" ON recruitment_applications
  FOR ALL USING (false);

-- ---------------------------------------------------------------------------
-- Sample published job for first tenant (ordinary org data, not hardcoded in app)
-- ---------------------------------------------------------------------------
INSERT INTO recruitment_jobs (
  organization_id,
  title,
  slug,
  description,
  responsibilities,
  requirements,
  qualifications,
  location,
  employment_type,
  work_mode,
  category,
  status,
  published_at
)
SELECT
  o.id,
  'Electrical Engineer',
  'electrical-engineer',
  'Join our engineering team to design, test, and maintain electrical systems for industrial and commercial projects.',
  E'• Design electrical layouts and control systems\n• Support commissioning and troubleshooting on site\n• Collaborate with mechanical and automation teams\n• Prepare technical documentation',
  E'• Degree or diploma in Electrical Engineering or related field\n• Practical experience with industrial electrical systems\n• Strong problem-solving and communication skills',
  E'• PLC exposure is a plus\n• Experience with panel wiring and protection devices\n• Willingness to work on site when required',
  'Kigali, Rwanda',
  'full_time',
  'hybrid',
  'Engineering',
  'published',
  NOW()
FROM recruitment_organizations o
WHERE lower(o.slug) = 'easyfab'
  AND o.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM recruitment_jobs j
    WHERE j.organization_id = o.id AND lower(j.slug) = 'electrical-engineer'
  );

NOTIFY pgrst, 'reload schema';
