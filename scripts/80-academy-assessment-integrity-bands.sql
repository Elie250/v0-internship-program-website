-- Academy assessment integrity bands + lecturer review (Phase 1 migration from Talent)
-- Run after scripts/35-assessment-integrity.sql
-- Advisory only — never auto-voids attempts or changes scores.
-- Does NOT modify recruitment_* tables.

ALTER TABLE assessment_attempts
  ADD COLUMN IF NOT EXISTS integrity_band TEXT,
  ADD COLUMN IF NOT EXISTS integrity_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS integrity_computed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assessment_attempts_integrity_band_check'
  ) THEN
    ALTER TABLE assessment_attempts
      ADD CONSTRAINT assessment_attempts_integrity_band_check
      CHECK (
        integrity_band IS NULL
        OR integrity_band IN ('NORMAL', 'LOW_CONCERN', 'REVIEW', 'HIGH_CONCERN')
      );
  END IF;
END $$;

ALTER TABLE assessment_attempt_events
  ADD COLUMN IF NOT EXISTS server_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sanitized_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS server_context JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE assessment_attempt_events
SET server_received_at = created_at
WHERE server_received_at IS NULL;

ALTER TABLE assessment_attempt_events
  ALTER COLUMN server_received_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS assessment_attempt_events_type_idx
  ON assessment_attempt_events (attempt_id, event_type, server_received_at DESC);

CREATE TABLE IF NOT EXISTS assessment_integrity_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES course_assessments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  reviewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  outcome TEXT NOT NULL
    CHECK (outcome IN (
      'reviewed',
      'no_concern',
      'concern_confirmed',
      'inconclusive',
      'proceed',
      'proceed_with_caution',
      'require_live_verification',
      'do_not_advance_recommended',
      'accept_attempt',
      'accept_with_caution',
      'require_oral_verification',
      'recommend_void'
    )),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assessment_integrity_reviews_attempt_idx
  ON assessment_integrity_reviews (attempt_id, created_at DESC);

CREATE INDEX IF NOT EXISTS assessment_integrity_reviews_course_idx
  ON assessment_integrity_reviews (course_id, created_at DESC);

ALTER TABLE assessment_integrity_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_public_assessment_integrity_reviews" ON assessment_integrity_reviews;
CREATE POLICY "deny_public_assessment_integrity_reviews" ON assessment_integrity_reviews
  FOR ALL USING (false);

COMMENT ON TABLE assessment_integrity_reviews IS
  'Lecturer/admin integrity decisions. Advisory only; does not auto-void attempts or mutate scores.';

-- Optional per-assessment threshold overrides (defaults in lib/integrity ACADEMY_INTEGRITY_THRESHOLDS)
ALTER TABLE course_assessments
  ADD COLUMN IF NOT EXISTS integrity_thresholds JSONB NOT NULL DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
