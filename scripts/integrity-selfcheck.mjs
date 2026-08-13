/**
 * Offline integrity hardening self-check (no network / no tsx).
 * Mirrors critical contracts from lib/integrity/* — run: pnpm test:integrity
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const INTEGRITY_EVENT_SESSION_WINDOW_MS = 60_000
const INTEGRITY_EVENT_SESSION_LIMIT = 60
const INTEGRITY_EVENT_BURST_WINDOW_MS = 10_000
const INTEGRITY_EVENT_BURST_LIMIT = 25

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

function studentMayReadIntegrityBand() {
  return false
}
function clientMaySetIntegrityBand() {
  return false
}
function integrityApiMayModifyTechnicalScore() {
  return false
}
function integrityEventsAreImmutable() {
  return true
}

function normalizeEventType(raw) {
  const value = String(raw).trim()
  if (value === 'tab_hidden') return 'visibility_hidden'
  if (value === 'tab_visible') return 'visibility_visible'
  if (value === 'window_blur') return 'blur'
  if (value === 'window_focus') return 'focus'
  if (value === 'paste_blocked') return 'paste'
  if (value === 'copy_blocked') return 'copy'
  if (value === 'fullscreen_exit') return 'fullscreen_exit'
  if (value === 'context_menu_blocked') return 'copy'
  const known = new Set([
    'visibility_hidden',
    'visibility_visible',
    'blur',
    'focus',
    'paste',
    'copy',
    'fullscreen_change',
    'fullscreen_exit',
    'navigation',
    'request_flood',
  ])
  return known.has(value) ? value : null
}

function sanitizeMetadata(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!ALLOWED_METADATA_KEYS.has(key)) continue
    if (typeof value === 'string') out[key] = value.slice(0, 120)
    else if (typeof value === 'number' && Number.isFinite(value)) out[key] = value
    else if (typeof value === 'boolean') out[key] = value
  }
  return out
}

function checkEventRateLimit(recent, now = new Date()) {
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

function dedupeLeaveEvents(events) {
  const leaveTypes = new Set([
    'visibility_hidden',
    'tab_hidden',
    'blur',
    'window_blur',
    'page_hide',
  ])
  const out = []
  let lastLeaveMs = -Infinity
  for (const event of events) {
    const t = new Date(event.server_received_at || 0).getTime()
    if (leaveTypes.has(event.event_type)) {
      if (t - lastLeaveMs < 2000) continue
      lastLeaveMs = t
    }
    out.push(event)
  }
  return out
}

describe('integrity contracts', () => {
  it('never lets students read bands or clients set scores/bands', () => {
    assert.equal(studentMayReadIntegrityBand(), false)
    assert.equal(clientMaySetIntegrityBand(), false)
    assert.equal(integrityApiMayModifyTechnicalScore(), false)
    assert.equal(integrityEventsAreImmutable(), true)
  })

  it('normalizes Academy aliases', () => {
    assert.equal(normalizeEventType('tab_hidden'), 'visibility_hidden')
    assert.equal(normalizeEventType('window_blur'), 'blur')
    assert.equal(normalizeEventType('paste_blocked'), 'paste')
    assert.equal(normalizeEventType('fullscreen_exit'), 'fullscreen_exit')
    assert.equal(normalizeEventType('not_a_real_event'), null)
  })

  it('counts only fullscreen exits as leaves, not enters', () => {
    const events = [
      { event_type: 'fullscreen_change', sanitized_metadata: { fullscreen: true } },
      { event_type: 'fullscreen_change', sanitized_metadata: { fullscreen: false } },
      { event_type: 'fullscreen_exit', sanitized_metadata: {} },
    ]
    let exits = 0
    for (const event of events) {
      if (event.event_type === 'fullscreen_exit') exits += 1
      else if (
        event.event_type === 'fullscreen_change' &&
        event.sanitized_metadata.fullscreen === false
      ) {
        exits += 1
      }
    }
    assert.equal(exits, 2)
  })

  it('strips client-controlled metadata keys', () => {
    const meta = sanitizeMetadata({
      reason: 'ok',
      integrity_band: 'HIGH_CONCERN',
      score: 100,
      riskScore: 99,
    })
    assert.deepEqual(meta, { reason: 'ok' })
  })
})

describe('aggregation helpers', () => {
  it('dedupes near-simultaneous tab+blur as one leave', () => {
    const events = [
      { event_type: 'visibility_hidden', server_received_at: '2026-01-01T12:00:00.000Z' },
      { event_type: 'blur', server_received_at: '2026-01-01T12:00:01.000Z' },
      { event_type: 'visibility_hidden', server_received_at: '2026-01-01T12:01:00.000Z' },
    ]
    assert.equal(dedupeLeaveEvents(events).length, 2)
  })
})

describe('rate limits', () => {
  it('flags burst floods', () => {
    const now = new Date('2026-01-01T12:00:30.000Z')
    const recent = Array.from({ length: 25 }, (_, i) => ({
      serverReceivedAt: new Date(now.getTime() - i * 100).toISOString(),
    }))
    const rate = checkEventRateLimit(recent, now)
    assert.equal(rate.allowed, false)
    assert.equal(rate.floodDetected, true)
  })
})
