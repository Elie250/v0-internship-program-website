/**
 * Shared integrity types — Talent screening + Academy assessments.
 * Integrity is a review signal, never proof of cheating.
 */

export const INTEGRITY_BANDS = ['NORMAL', 'LOW_CONCERN', 'REVIEW', 'HIGH_CONCERN'] as const
export type IntegrityBand = (typeof INTEGRITY_BANDS)[number]

export type IntegrityProduct = 'talent' | 'academy'

export const INTEGRITY_REVIEW_OUTCOMES = [
  'reviewed',
  'no_concern',
  'concern_confirmed',
  'inconclusive',
  'proceed',
  'proceed_with_caution',
  'require_live_verification',
  'do_not_advance_recommended',
  /** Academy aliases (same advisory semantics) */
  'accept_attempt',
  'accept_with_caution',
  'require_oral_verification',
  'recommend_void',
] as const
export type IntegrityReviewOutcome = (typeof INTEGRITY_REVIEW_OUTCOMES)[number]

export const INTEGRITY_EVENT_TYPES = [
  'visibility_hidden',
  'visibility_visible',
  'tab_hidden',
  'tab_visible',
  'focus',
  'blur',
  'window_blur',
  'window_focus',
  'fullscreen_change',
  'fullscreen_exit',
  'copy',
  'paste',
  'copy_blocked',
  'paste_blocked',
  'context_menu_blocked',
  'inactivity',
  'navigation',
  'page_hide',
  'page_show',
  'page_freeze',
  'page_resume',
  'request_flood',
] as const
export type IntegrityEventType = (typeof INTEGRITY_EVENT_TYPES)[number]

export type IntegrityThresholds = {
  visibilityLow: number
  visibilityReview: number
  visibilityHigh: number
  clipboardLow: number
  clipboardReview: number
  clipboardHigh: number
  navigationLow: number
  navigationReview: number
  navigationHigh: number
  inactivityLow: number
  inactivityReview: number
  floodReview: number
  floodHigh: number
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

/** Slightly tighter defaults for timed academic quizzes. */
export const ACADEMY_INTEGRITY_THRESHOLDS: IntegrityThresholds = {
  ...DEFAULT_INTEGRITY_THRESHOLDS,
  visibilityLow: 2,
  visibilityReview: 4,
  visibilityHigh: 8,
  clipboardLow: 1,
  clipboardReview: 2,
  clipboardHigh: 4,
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
  overrides?: Record<string, unknown> | null,
  base: IntegrityThresholds = DEFAULT_INTEGRITY_THRESHOLDS
): IntegrityThresholds {
  const next = { ...base }
  if (!overrides || typeof overrides !== 'object') return next
  for (const key of Object.keys(next) as Array<keyof IntegrityThresholds>) {
    const raw = overrides[key]
    if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
      next[key] = raw
    }
  }
  return next
}

export function integrityDecisionLabels(
  product: IntegrityProduct = 'talent'
): Record<IntegrityReviewOutcome, string> {
  if (product === 'academy') {
    return {
      reviewed: 'Marked as reviewed',
      no_concern: 'No integrity concern',
      concern_confirmed: 'Concern confirmed (manual action still required)',
      inconclusive: 'Inconclusive — need more evidence',
      proceed: 'Accept attempt',
      proceed_with_caution: 'Accept with caution',
      require_live_verification: 'Require oral / live verification',
      do_not_advance_recommended: 'Recommend void (manual void still required)',
      accept_attempt: 'Accept attempt',
      accept_with_caution: 'Accept with caution',
      require_oral_verification: 'Require oral / live verification',
      recommend_void: 'Recommend void (manual void still required)',
    }
  }
  return {
    reviewed: 'Marked as reviewed',
    no_concern: 'No integrity concern',
    concern_confirmed: 'Concern confirmed (manual decision still required)',
    inconclusive: 'Inconclusive — need more evidence',
    proceed: 'Proceed in pipeline',
    proceed_with_caution: 'Proceed with caution / extra interview',
    require_live_verification: 'Require live verification before advancing',
    do_not_advance_recommended: 'Recommend not advancing (manual reject still required)',
    accept_attempt: 'Proceed in pipeline',
    accept_with_caution: 'Proceed with caution / extra interview',
    require_oral_verification: 'Require live verification before advancing',
    recommend_void: 'Recommend not advancing (manual reject still required)',
  }
}

/** @deprecated Prefer integrityDecisionLabels(product) */
export const INTEGRITY_DECISION_LABELS = integrityDecisionLabels('talent')

export function integrityRecommendation(
  band: IntegrityBand,
  product: IntegrityProduct = 'talent'
): string {
  if (product === 'academy') {
    switch (band) {
      case 'NORMAL':
        return 'No integrity review required — proceed based on score and course policy.'
      case 'LOW_CONCERN':
        return 'Optional light review — a few attention signals are common and not proof of cheating.'
      case 'REVIEW':
        return 'Review recommended — use the timeline, then record a human decision. Do not auto-void.'
      case 'HIGH_CONCERN':
        return 'Priority lecturer review recommended — consider a short oral check. Do not auto-void or change the score.'
      default:
        return 'Review recommended — human decision required.'
    }
  }
  switch (band) {
    case 'NORMAL':
      return 'No integrity review required — proceed based on technical score and interview.'
    case 'LOW_CONCERN':
      return 'Optional light review — a few attention signals are common and not proof of cheating.'
    case 'REVIEW':
      return 'Review recommended — use the timeline, then record a human decision. Do not auto-reject.'
    case 'HIGH_CONCERN':
      return 'Priority human review recommended — consider a live verification interview. Do not auto-reject.'
    default:
      return 'Review recommended — human decision required.'
  }
}

export function integrityBandSummary(
  band: IntegrityBand,
  product: IntegrityProduct = 'talent'
): string {
  const activity = product === 'academy' ? 'assessment' : 'screening'
  switch (band) {
    case 'NORMAL':
      return 'No unusual integrity signals detected.'
    case 'LOW_CONCERN':
      return 'A small number of browser attention signals were recorded.'
    case 'REVIEW':
      return `Multiple browser attention or interaction signals occurred during the ${activity}.`
    case 'HIGH_CONCERN':
      return 'Frequent or combined integrity signals were recorded. Human review is recommended.'
    default:
      return 'Integrity signals were recorded.'
  }
}

export function integritySuggestedActions(
  band: IntegrityBand,
  product: IntegrityProduct = 'talent'
): string[] {
  if (product === 'academy') {
    switch (band) {
      case 'NORMAL':
        return [
          'Continue with the recorded score for gradebook / certificate decisions.',
          'No special integrity follow-up needed.',
        ]
      case 'LOW_CONCERN':
        return [
          'Skim the integrity timeline if desired.',
          'Accept the attempt unless other evidence raises concern.',
        ]
      case 'REVIEW':
        return [
          'Open the integrity timeline and note unusual patterns (tab switches, paste bursts).',
          'Ask a short clarifying question in class or viva if needed.',
          'Record a decision: accept, accept with caution, or require oral verification.',
        ]
      case 'HIGH_CONCERN':
        return [
          'Review the full integrity timeline before approving certificates.',
          'Prefer a short oral check over automatic voiding.',
          'Record “require oral verification” or “recommend void” — then void or re-open attempts manually if needed.',
        ]
      default:
        return ['Record a human integrity decision before finalizing grades.']
    }
  }
  switch (band) {
    case 'NORMAL':
      return [
        'Continue evaluating technical score and interview feedback.',
        'No special integrity follow-up needed.',
      ]
    case 'LOW_CONCERN':
      return [
        'Skim the integrity timeline if desired.',
        'Proceed unless other evidence raises concern.',
      ]
    case 'REVIEW':
      return [
        'Open the integrity timeline and note unusual patterns (tab switches, paste bursts).',
        'Ask clarifying questions in interview if needed.',
        'Record a decision: proceed, proceed with caution, or require live verification.',
      ]
    case 'HIGH_CONCERN':
      return [
        'Review the full integrity timeline before advancing.',
        'Prefer a short live technical check over automatic rejection.',
        'Record “require live verification” or “recommend not advancing” — then update pipeline status manually.',
      ]
    default:
      return ['Record a human integrity decision before advancing.']
  }
}
