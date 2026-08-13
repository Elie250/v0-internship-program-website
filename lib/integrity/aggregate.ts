/**
 * Explainable integrity aggregation from normalized events.
 * Scores and answer speed are intentionally ignored.
 */

import {
  integrityBandSummary,
  integrityRecommendation,
  maxBand,
  mergeIntegrityThresholds,
  type IntegrityBand,
  type IntegrityProduct,
  type IntegrityThresholds,
  DEFAULT_INTEGRITY_THRESHOLDS,
} from './types'

export type IntegrityEventRecord = {
  id?: string
  event_type: string
  server_received_at?: string | null
  session_item_id?: string | null
  payload?: Record<string, unknown> | null
  sanitized_metadata?: Record<string, unknown> | null
  server_context?: Record<string, unknown> | null
  /** Academy legacy column — treated as server time when present */
  created_at?: string | null
  metadata?: Record<string, unknown> | null
}

export type IntegrityCategoryCounts = {
  visibilityLeaves: number
  clipboardAttempts: number
  navigationAttempts: number
  inactivityEvents: number
  floodEvents: number
  total: number
}

export type IntegrityReason = {
  code: string
  message: string
  count?: number
}

export type IntegrityAssessment = {
  band: IntegrityBand
  summaryText: string
  recommendation: string
  reasons: IntegrityReason[]
  categories: IntegrityCategoryCounts
  categoryBands: Record<string, IntegrityBand>
  eventCount: number
  thresholds: IntegrityThresholds
  usesTechnicalScore: false
}

function eventTime(event: IntegrityEventRecord): string {
  return event.server_received_at || event.created_at || new Date(0).toISOString()
}

function countByType(events: IntegrityEventRecord[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const event of events) {
    map.set(event.event_type, (map.get(event.event_type) ?? 0) + 1)
  }
  return map
}

/**
 * Collapse near-simultaneous leave signals (tab_hidden + blur within 2s)
 * so one Alt-Tab does not count twice.
 */
export function dedupeLeaveEvents(events: IntegrityEventRecord[]): IntegrityEventRecord[] {
  const leaveTypes = new Set([
    'visibility_hidden',
    'tab_hidden',
    'blur',
    'window_blur',
    'page_hide',
  ])
  const sorted = [...events].sort(
    (a, b) => new Date(eventTime(a)).getTime() - new Date(eventTime(b)).getTime()
  )
  const out: IntegrityEventRecord[] = []
  let lastLeaveMs = -Infinity
  for (const event of sorted) {
    const t = new Date(eventTime(event)).getTime()
    if (leaveTypes.has(event.event_type)) {
      if (t - lastLeaveMs < 2000) continue
      lastLeaveMs = t
    }
    out.push(event)
  }
  return out
}

function bandFromCount(
  count: number,
  low: number,
  review: number,
  high: number
): IntegrityBand {
  if (count <= 0) return 'NORMAL'
  if (count < low) return 'NORMAL'
  if (count < review) return 'LOW_CONCERN'
  if (count < high) return 'REVIEW'
  return 'HIGH_CONCERN'
}

export function categorizeIntegrityEvents(events: IntegrityEventRecord[]): IntegrityCategoryCounts {
  const byType = countByType(events)
  let fullscreenExits = byType.get('fullscreen_exit') ?? 0
  // fullscreen_change is ambiguous: count only when client reported leaving fullscreen
  for (const event of events) {
    if (event.event_type !== 'fullscreen_change') continue
    const meta = (event.sanitized_metadata ?? event.metadata ?? {}) as Record<string, unknown>
    if (meta.fullscreen === false) fullscreenExits += 1
  }
  const visibilityLeaves =
    (byType.get('visibility_hidden') ?? 0) +
    (byType.get('tab_hidden') ?? 0) +
    (byType.get('blur') ?? 0) +
    (byType.get('window_blur') ?? 0) +
    (byType.get('page_hide') ?? 0) +
    fullscreenExits
  const clipboardAttempts =
    (byType.get('copy') ?? 0) +
    (byType.get('paste') ?? 0) +
    (byType.get('copy_blocked') ?? 0) +
    (byType.get('paste_blocked') ?? 0) +
    (byType.get('context_menu_blocked') ?? 0)
  const navigationAttempts = byType.get('navigation') ?? 0
  const inactivityEvents = byType.get('inactivity') ?? 0
  const floodEvents = byType.get('request_flood') ?? 0

  return {
    visibilityLeaves,
    clipboardAttempts,
    navigationAttempts,
    inactivityEvents,
    floodEvents,
    total: events.length,
  }
}

export function aggregateIntegrityAssessment(
  events: IntegrityEventRecord[],
  thresholdOverrides?: Record<string, unknown> | null,
  options?: {
    product?: IntegrityProduct
    baseThresholds?: IntegrityThresholds
    dedupeLeaves?: boolean
  }
): IntegrityAssessment {
  const product = options?.product ?? 'talent'
  const base = options?.baseThresholds ?? DEFAULT_INTEGRITY_THRESHOLDS
  const thresholds = mergeIntegrityThresholds(thresholdOverrides, base)
  const prepared = options?.dedupeLeaves === false ? events : dedupeLeaveEvents(events)
  const categories = categorizeIntegrityEvents(prepared)
  const reasons: IntegrityReason[] = []
  const categoryBands: Record<string, IntegrityBand> = {}

  const activity = product === 'academy' ? 'assessment' : 'screening'

  const visibilityBand = bandFromCount(
    categories.visibilityLeaves,
    thresholds.visibilityLow,
    thresholds.visibilityReview,
    thresholds.visibilityHigh
  )
  categoryBands.visibility = visibilityBand
  if (visibilityBand !== 'NORMAL') {
    reasons.push({
      code: 'visibility_changes',
      count: categories.visibilityLeaves,
      message:
        categories.visibilityLeaves === 1
          ? `A visibility or focus change was recorded during the ${activity}.`
          : `Multiple visibility or focus changes were recorded (${categories.visibilityLeaves}).`,
    })
  }

  const clipboardBand = bandFromCount(
    categories.clipboardAttempts,
    thresholds.clipboardLow,
    thresholds.clipboardReview,
    thresholds.clipboardHigh
  )
  categoryBands.clipboard = clipboardBand
  if (clipboardBand !== 'NORMAL') {
    reasons.push({
      code: 'clipboard_activity',
      count: categories.clipboardAttempts,
      message: `Clipboard interaction signals were recorded (${categories.clipboardAttempts}).`,
    })
  }

  const navigationBand = bandFromCount(
    categories.navigationAttempts,
    thresholds.navigationLow,
    thresholds.navigationReview,
    thresholds.navigationHigh
  )
  categoryBands.navigation = navigationBand
  if (navigationBand !== 'NORMAL') {
    reasons.push({
      code: 'navigation_attempts',
      count: categories.navigationAttempts,
      message: `Navigation or leave attempts were recorded (${categories.navigationAttempts}).`,
    })
  }

  const inactivityBand = bandFromCount(
    categories.inactivityEvents,
    thresholds.inactivityLow,
    thresholds.inactivityReview,
    thresholds.inactivityReview + 100
  )
  categoryBands.inactivity = inactivityBand
  if (inactivityBand !== 'NORMAL') {
    reasons.push({
      code: 'inactivity',
      count: categories.inactivityEvents,
      message: `Extended inactivity signals were recorded (${categories.inactivityEvents}).`,
    })
  }

  let floodBand: IntegrityBand = 'NORMAL'
  if (categories.floodEvents >= thresholds.floodHigh) floodBand = 'HIGH_CONCERN'
  else if (categories.floodEvents >= thresholds.floodReview) floodBand = 'REVIEW'
  categoryBands.flood = floodBand
  if (floodBand !== 'NORMAL') {
    reasons.push({
      code: 'request_flood',
      count: categories.floodEvents,
      message: 'Unusual event submission frequency was detected by the server.',
    })
  }

  let band: IntegrityBand = 'NORMAL'
  for (const b of Object.values(categoryBands)) band = maxBand(band, b)

  const reviewPlus = Object.values(categoryBands).filter(
    (b) => b === 'REVIEW' || b === 'HIGH_CONCERN'
  ).length
  if (reviewPlus >= thresholds.multiCategoryEscalate && band === 'REVIEW') {
    band = 'HIGH_CONCERN'
    reasons.push({
      code: 'combined_signals',
      message: 'Signals appeared across multiple categories, so a stronger review is recommended.',
    })
  }

  if (band === 'NORMAL') {
    reasons.push({
      code: 'none',
      message: 'No unusual integrity signals detected.',
    })
  }

  return {
    band,
    summaryText: integrityBandSummary(band, product),
    recommendation: integrityRecommendation(band, product),
    reasons,
    categories,
    categoryBands,
    eventCount: events.length,
    thresholds,
    usesTechnicalScore: false,
  }
}

export function buildIntegrityTimeline(events: IntegrityEventRecord[]) {
  return [...events]
    .sort((a, b) => new Date(eventTime(a)).getTime() - new Date(eventTime(b)).getTime())
    .map((event) => ({
      id: event.id,
      eventType: event.event_type,
      serverReceivedAt: eventTime(event),
      sessionItemId: event.session_item_id ?? null,
      metadata: event.sanitized_metadata ?? event.payload ?? event.metadata ?? {},
      context: event.server_context ?? {},
    }))
}

export function fastCorrectAnswerRaisesIntegrityBand(): boolean {
  return false
}
