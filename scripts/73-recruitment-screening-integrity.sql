-- Phase 5: Energy & Logics Talent — Screening Integrity & HR Evidence
-- Explainable integrity bands from browser signals (not cheating verdicts)
-- Run after scripts/72-recruitment-screening-engine.sql
-- Does NOT modify Academy tables.
-- Does NOT implement AI, webcam, or automated hiring decisions.

-- ---------------------------------------------------------------------------
-- Extend screening events for normalized evidence
-- ---------------------------------------------------------------------------
ALTER TABLE recruitment_screening_events
  ADD COLUMN IF NOT EXISTS session_item_id UUID REFERENCES recruitment_session_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sanitized_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS server_context JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS recruitment_screening_events_item_idx
  ON recruitment_screening_events (session_item_id)
  WHERE session_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS recruitment_screening_events_type_idx
  ON recruitment_screening_events (session_id, event_type, server_received_at DESC);

-- ---------------------------------------------------------------------------
-- Session-level integrity assessment (separate from technical_score)
-- ---------------------------------------------------------------------------
ALTER TABLE recruitment_screening_sessions
  ADD COLUMN IF NOT EXISTS integrity_band TEXT,
  ADD COLUMN IF NOT EXISTS integrity_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS integrity_computed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_screening_sessions_integrity_band_check'
  ) THEN
    ALTER TABLE recruitment_screening_sessions
      ADD CONSTRAINT recruitment_screening_sessions_integrity_band_check
      CHECK (
        integrity_band IS NULL
        OR integrity_band IN ('NORMAL', 'LOW_CONCERN', 'REVIEW', 'HIGH_CONCERN')
      );
  END IF;
END $$;

-- Optional per-job threshold overrides (defaults live in application code)
ALTER TABLE recruitment_screening_configs
  ADD COLUMN IF NOT EXISTS integrity_thresholds JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- HR integrity review outcomes (do not delete original events)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruitment_integrity_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES recruitment_screening_sessions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  reviewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  outcome TEXT NOT NULL
    CHECK (outcome IN (
      'reviewed',
      'no_concern',
      'concern_confirmed',
      'inconclusive'
    )),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recruitment_integrity_reviews_session_idx
  ON recruitment_integrity_reviews (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_integrity_reviews_org_idx
  ON recruitment_integrity_reviews (organization_id, created_at DESC);

ALTER TABLE recruitment_integrity_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_public_recruitment_integrity_reviews" ON recruitment_integrity_reviews;
CREATE POLICY "deny_public_recruitment_integrity_reviews" ON recruitment_integrity_reviews
  FOR ALL USING (false);

NOTIFY pgrst, 'reload schema';
