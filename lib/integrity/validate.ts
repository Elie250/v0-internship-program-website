/**
 * Validate and sanitize integrity events (Talent + Academy).
 * Pure helpers — no DB. Server timestamps remain authoritative.
 */

import {
  isIntegrityEventType,
  type IntegrityEventType,
} from './types'

export const INTEGRITY_EVENT_MAX_PAYLOAD_BYTES = 2048
export const INTEGRITY_EVENT_SESSION_WINDOW_MS = 60_000
export const INTEGRITY_EVENT_SESSION_LIMIT = 60
export const INTEGRITY_EVENT_BURST_WINDOW_MS = 10_000
export const INTEGRITY_EVENT_BURST_LIMIT = 25

const ALLOWED_METADATA_KEYS = new Set([
  'path',
  'visibilityState',
  'fullscreen',
  'durationMs',
  'reason',
  'itemSortOrder',
  'assessmentId',
  'questionId',
])

export type SanitizedIntegrityEvent = {
  eventType: IntegrityEventType
  payload: Record<string, unknown>
  sanitizedMetadata: Record<string, unknown>
  clientEventAt: string | null
  sessionItemId: string | null
}

export function rejectClientControlledIntegrityFields(body: Record<string, unknown>): void {
  void body.integrity_band
  void body.integrityBand
  void body.riskScore
  void body.severity
  void body.server_received_at
  void body.serverReceivedAt
  void body.technical_score
  void body.technicalScore
  void body.score
}

export function sanitizePayload(raw: unknown): {
  payload: Record<string, unknown>
  error?: string
} {
  if (raw == null) return { payload: {} }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { payload: {}, error: 'Event payload must be an object' }
  }
  const json = JSON.stringify(raw)
  if (json.length > INTEGRITY_EVENT_MAX_PAYLOAD_BYTES) {
    return { payload: {}, error: 'Event payload too large' }
  }
  const src = raw as Record<string, unknown>
  const payload: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(src)) {
    if (key === 'integrity_band' || key === 'integrityBand') continue
    if (key === 'riskScore' || key === 'severity') continue
    if (key === 'technical_score' || key === 'technicalScore' || key === 'score') continue
    if (typeof value === 'string') {
      payload[key] = value.slice(0, 200)
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      payload[key] = value
    } else if (typeof value === 'boolean') {
      payload[key] = value
    } else if (value == null) {
      payload[key] = null
    }
  }
  return { payload }
}

export function sanitizeMetadata(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!ALLOWED_METADATA_KEYS.has(key)) continue
    if (typeof value === 'string') out[key] = value.slice(0, 120)
    else if (typeof value === 'number' && Number.isFinite(value)) out[key] = value
    else if (typeof value === 'boolean') out[key] = value
  }
  return out
}

/** Normalize client aliases into canonical event types used by aggregation. */
export function normalizeEventType(raw: string): IntegrityEventType | null {
  const value = raw.trim()
  if (!isIntegrityEventType(value) && !value) return null

  // Academy UI aliases → canonical Talent-compatible types for aggregation
  if (value === 'tab_hidden') return 'visibility_hidden'
  if (value === 'tab_visible') return 'visibility_visible'
  if (value === 'window_blur') return 'blur'
  if (value === 'window_focus') return 'focus'
  if (value === 'paste_blocked') return 'paste'
  if (value === 'copy_blocked') return 'copy'
  if (value === 'context_menu_blocked') return 'copy'
  // Keep fullscreen_exit distinct so entering fullscreen is not counted as a leave.
  // fullscreen_change with metadata.fullscreen === false is also treated as an exit in aggregation.
  if (value === 'fullscreen_exit') return 'fullscreen_exit'

  if (isIntegrityEventType(value)) return value
  return null
}

export function normalizeClientEventAt(
  clientEventAt: string | null | undefined,
  serverNow = new Date()
): string | null {
  if (!clientEventAt) return null
  const t = new Date(clientEventAt)
  if (Number.isNaN(t.getTime())) return null
  if (t.getTime() > serverNow.getTime() + 60_000) return serverNow.toISOString()
  if (t.getTime() < serverNow.getTime() - 24 * 60 * 60 * 1000) return null
  return t.toISOString()
}

export function parseUuid(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)) {
    return null
  }
  return v
}

export function validateIntegrityEventInput(input: {
  eventType: string
  payload?: unknown
  metadata?: unknown
  clientEventAt?: string | null
  sessionItemId?: unknown
}): { ok: true; event: SanitizedIntegrityEvent } | { ok: false; error: string } {
  const eventType = normalizeEventType(input.eventType)
  if (!eventType) return { ok: false, error: 'Unsupported event type' }

  const sanitized = sanitizePayload(input.payload)
  if (sanitized.error) return { ok: false, error: sanitized.error }

  const sessionItemId = input.sessionItemId != null ? parseUuid(input.sessionItemId) : null
  if (input.sessionItemId != null && !sessionItemId) {
    return { ok: false, error: 'Invalid session item reference' }
  }

  return {
    ok: true,
    event: {
      eventType,
      payload: sanitized.payload,
      sanitizedMetadata: sanitizeMetadata(input.metadata),
      clientEventAt: normalizeClientEventAt(input.clientEventAt),
      sessionItemId,
    },
  }
}

export type EventRateSample = { serverReceivedAt: string }

export function checkEventRateLimit(
  recent: EventRateSample[],
  now = new Date()
): { allowed: boolean; floodDetected: boolean; reason?: string } {
  const nowMs = now.getTime()
  const inWindow = recent.filter(
    (e) => nowMs - new Date(e.serverReceivedAt).getTime() <= INTEGRITY_EVENT_SESSION_WINDOW_MS
  )
  const inBurst = recent.filter(
    (e) => nowMs - new Date(e.serverReceivedAt).getTime() <= INTEGRITY_EVENT_BURST_WINDOW_MS
  )

  if (inBurst.length >= INTEGRITY_EVENT_BURST_LIMIT) {
    return { allowed: false, floodDetected: true, reason: 'burst_limit' }
  }
  if (inWindow.length >= INTEGRITY_EVENT_SESSION_LIMIT) {
    return { allowed: false, floodDetected: true, reason: 'window_limit' }
  }
  return { allowed: true, floodDetected: false }
}

/** Students / candidates must never read integrity bands via their own APIs. */
export function studentMayReadIntegrityBand(): boolean {
  return false
}

/** @deprecated Use studentMayReadIntegrityBand */
export function candidateMayReadIntegrityBand(): boolean {
  return false
}

export function integrityApiMayModifyTechnicalScore(): boolean {
  return false
}

export function clientMaySetIntegrityBand(): boolean {
  return false
}

export function integrityEventsAreImmutable(): boolean {
  return true
}
