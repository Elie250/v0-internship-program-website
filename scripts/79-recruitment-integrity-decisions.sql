-- Phase 9b: Expand integrity review outcomes for hiring-manager decisions
-- Advisory only — never auto-rejects applications or changes technical_score.
-- Run after scripts/73-recruitment-screening-integrity.sql

ALTER TABLE recruitment_integrity_reviews
  DROP CONSTRAINT IF EXISTS recruitment_integrity_reviews_outcome_check;

ALTER TABLE recruitment_integrity_reviews
  ADD CONSTRAINT recruitment_integrity_reviews_outcome_check
  CHECK (
    outcome IN (
      'reviewed',
      'no_concern',
      'concern_confirmed',
      'inconclusive',
      'proceed',
      'proceed_with_caution',
      'require_live_verification',
      'do_not_advance_recommended'
    )
  );

COMMENT ON TABLE recruitment_integrity_reviews IS
  'Hiring-manager integrity decisions. Advisory only; does not auto-reject candidates or mutate technical scores.';

NOTIFY pgrst, 'reload schema';
