/**
 * Talent screening integrity types — re-exports shared engine + Talent defaults.
 */
export {
  INTEGRITY_BANDS,
  INTEGRITY_REVIEW_OUTCOMES,
  INTEGRITY_EVENT_TYPES,
  DEFAULT_INTEGRITY_THRESHOLDS,
  integrityDecisionLabels,
  integrityRecommendation,
  integrityBandSummary,
  integritySuggestedActions,
  isIntegrityBand,
  isIntegrityReviewOutcome,
  isIntegrityEventType,
  bandRank,
  maxBand,
  mergeIntegrityThresholds,
  type IntegrityBand,
  type IntegrityReviewOutcome,
  type IntegrityEventType,
  type IntegrityThresholds,
  type IntegrityProduct,
} from '@/lib/integrity/types'

import { integrityDecisionLabels, type IntegrityReviewOutcome } from '@/lib/integrity/types'

/** Outcomes shown on employer integrity decision UI */
export const TALENT_INTEGRITY_REVIEW_OUTCOMES = [
  'reviewed',
  'no_concern',
  'concern_confirmed',
  'inconclusive',
  'proceed',
  'proceed_with_caution',
  'require_live_verification',
  'do_not_advance_recommended',
] as const satisfies readonly IntegrityReviewOutcome[]

export const INTEGRITY_DECISION_LABELS: Record<
  (typeof TALENT_INTEGRITY_REVIEW_OUTCOMES)[number],
  string
> = Object.fromEntries(
  TALENT_INTEGRITY_REVIEW_OUTCOMES.map((key) => [key, integrityDecisionLabels('talent')[key]])
) as Record<(typeof TALENT_INTEGRITY_REVIEW_OUTCOMES)[number], string>
