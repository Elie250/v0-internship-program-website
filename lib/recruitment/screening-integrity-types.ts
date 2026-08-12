/**
 * Screening integrity types, configurable thresholds, and band helpers.
 * Integrity is a review signal — never proof of cheating.
 */

export const INTEGRITY_BANDS = ['NORMAL', 'LOW_CONCERN', 'REVIEW', 'HIGH_CONCERN'] as const
export type IntegrityBand = (typeof INTEGRITY_BANDS)[number]

export const INTEGRITY_REVIEW_OUTCOMES = [
  'reviewed',
  'no_concern',
  'concern_confirmed',
  'inconclusive',
] as const
export type IntegrityReviewOutcome = (typeof INTEGRITY_REVIEW_OUTCOMES)[number]

export const INTEGRITY_EVENT_TYPES = [
  'visibility_hidden',
  'visibility_visible',
  'tab_hidden',
  'tab_visible',
  'focus',
  'blur',
  'fullscreen_change',
  'copy',
  'paste',
  'inactivity',
  'navigation',
  'page_hide',
  'page_show',
  'page_freeze',
  'page_resume',
  'request_flood',
] as const
export type IntegrityEventType = (typeof INTEGRITY_EVENT_TYPES)[number]

/** Default thresholds — documented and overridable via screening config.integrity_thresholds */
export type IntegrityThresholds = {
  /** Visibility/blur leave events */
  visibilityLow: number
  visibilityReview: number
  visibilityHigh: number
  /** Copy/paste attempts */
  clipboardLow: number
  clipboardReview: number
  clipboardHigh: number
  /** Navigation / leave attempts */
  navigationLow: number
  navigationReview: number
  navigationHigh: number
  /** Long inactivity bursts */
  inactivityLow: number
  inactivityReview: number
  /** Server-detected request floods */
  floodReview: number
  floodHigh: number
  /** Escalate when this many categories are at least REVIEW */
  multiCategoryEscalate: number
}

export const DEFAULT_INTEGRITY_THRESHOLDS: IntegrityThresholds = {
  visibilityLow: 2,
  visibilityReview: 5,
  visibilityHigh: 10,
  clipboardLow: 1,
  clipboardReview: 3,
  clipboardHigh: 6,
  navigationLow: 1,
  navigationReview: 2,
  navigationHigh: 4,
  inactivityLow: 2,
  inactivityReview: 4,
  floodReview: 1,
  floodHigh: 3,
  multiCategoryEscalate: 2,
}

export function isIntegrityBand(value: string): value is IntegrityBand {
  return (INTEGRITY_BANDS as readonly string[]).includes(value)
}

export function isIntegrityReviewOutcome(value: string): value is IntegrityReviewOutcome {
  return (INTEGRITY_REVIEW_OUTCOMES as readonly string[]).includes(value)
}

export function isIntegrityEventType(value: string): value is IntegrityEventType {
  return (INTEGRITY_EVENT_TYPES as readonly string[]).includes(value)
}

export function bandRank(band: IntegrityBand): number {
  switch (band) {
    case 'NORMAL':
      return 0
    case 'LOW_CONCERN':
      return 1
    case 'REVIEW':
      return 2
    case 'HIGH_CONCERN':
      return 3
    default:
      return 0
  }
}

export function maxBand(a: IntegrityBand, b: IntegrityBand): IntegrityBand {
  return bandRank(a) >= bandRank(b) ? a : b
}

export function mergeIntegrityThresholds(
  overrides?: Record<string, unknown> | null
): IntegrityThresholds {
  const base = { ...DEFAULT_INTEGRITY_THRESHOLDS }
  if (!overrides || typeof overrides !== 'object') return base
  for (const key of Object.keys(base) as Array<keyof IntegrityThresholds>) {
    const raw = overrides[key]
    if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
      base[key] = raw
    }
  }
  return base
}

export function integrityRecommendation(band: IntegrityBand): string {
  switch (band) {
    case 'NORMAL':
      return 'No integrity review required'
    case 'LOW_CONCERN':
      return 'Optional light review'
    case 'REVIEW':
      return 'Review recommended'
    case 'HIGH_CONCERN':
      return 'Priority review recommended'
    default:
      return 'Review recommended'
  }
}

export function integrityBandSummary(band: IntegrityBand): string {
  switch (band) {
    case 'NORMAL':
      return 'No unusual integrity signals detected.'
    case 'LOW_CONCERN':
      return 'A small number of browser attention signals were recorded.'
    case 'REVIEW':
      return 'Multiple browser attention or interaction signals occurred during the screening.'
    case 'HIGH_CONCERN':
      return 'Frequent or combined integrity signals were recorded. Human review is recommended.'
    default:
      return 'Integrity signals were recorded.'
  }
}
