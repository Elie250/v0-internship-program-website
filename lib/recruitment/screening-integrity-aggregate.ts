/**
 * Talent screening integrity aggregation — shared engine (Talent product copy).
 */
export {
  categorizeIntegrityEvents,
  aggregateIntegrityAssessment,
  buildIntegrityTimeline,
  dedupeLeaveEvents,
  fastCorrectAnswerRaisesIntegrityBand,
  type IntegrityEventRecord,
  type IntegrityCategoryCounts,
  type IntegrityReason,
  type IntegrityAssessment,
} from '@/lib/integrity/aggregate'

import {
  aggregateIntegrityAssessment as sharedAggregate,
  type IntegrityEventRecord,
  type IntegrityAssessment,
} from '@/lib/integrity/aggregate'

/** Convenience wrapper that always uses Talent wording. */
export function aggregateTalentIntegrityAssessment(
  events: IntegrityEventRecord[],
  thresholdOverrides?: Record<string, unknown> | null
): IntegrityAssessment {
  return sharedAggregate(events, thresholdOverrides, { product: 'talent', dedupeLeaves: true })
}
