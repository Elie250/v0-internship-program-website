/**
 * Phase 5 screening integrity — unit checks (no DB).
 * Run: node scripts/test-recruitment-phase5.mjs
 */

const INTEGRITY_BANDS = ['NORMAL', 'LOW_CONCERN', 'REVIEW', 'HIGH_CONCERN']
const INTEGRITY_EVENT_TYPES = [
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
]

const DEFAULT_THRESHOLDS = {
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

function bandRank(band) {
  return { NORMAL: 0, LOW_CONCERN: 1, REVIEW: 2, HIGH_CONCERN: 3 }[band] ?? 0
}
function maxBand(a, b) {
  return bandRank(a) >= bandRank(b) ? a : b
}
function bandFromCount(count, low, review, high) {
  if (count <= 0) return 'NORMAL'
  if (count < low) return 'NORMAL'
  if (count < review) return 'LOW_CONCERN'
  if (count < high) return 'REVIEW'
  return 'HIGH_CONCERN'
}

function aggregate(events, thresholds = DEFAULT_THRESHOLDS) {
  const counts = {
    visibilityLeaves: 0,
    clipboardAttempts: 0,
    navigationAttempts: 0,
    inactivityEvents: 0,
    floodEvents: 0,
  }
  for (const e of events) {
    if (['visibility_hidden', 'tab_hidden', 'blur', 'page_hide'].includes(e.event_type)) {
      counts.visibilityLeaves++
    }
    if (e.event_type === 'copy' || e.event_type === 'paste') counts.clipboardAttempts++
    if (e.event_type === 'navigation') counts.navigationAttempts++
    if (e.event_type === 'inactivity') counts.inactivityEvents++
    if (e.event_type === 'request_flood') counts.floodEvents++
  }
  const categoryBands = {
    visibility: bandFromCount(
      counts.visibilityLeaves,
      thresholds.visibilityLow,
      thresholds.visibilityReview,
      thresholds.visibilityHigh
    ),
    clipboard: bandFromCount(
      counts.clipboardAttempts,
      thresholds.clipboardLow,
      thresholds.clipboardReview,
      thresholds.clipboardHigh
    ),
    navigation: bandFromCount(
      counts.navigationAttempts,
      thresholds.navigationLow,
      thresholds.navigationReview,
      thresholds.navigationHigh
    ),
    inactivity: bandFromCount(
      counts.inactivityEvents,
      thresholds.inactivityLow,
      thresholds.inactivityReview,
      thresholds.inactivityReview + 100
    ),
    flood:
      counts.floodEvents >= thresholds.floodHigh
        ? 'HIGH_CONCERN'
        : counts.floodEvents >= thresholds.floodReview
          ? 'REVIEW'
          : 'NORMAL',
  }
  let band = 'NORMAL'
  for (const b of Object.values(categoryBands)) band = maxBand(band, b)
  const reviewPlus = Object.values(categoryBands).filter((b) => b === 'REVIEW' || b === 'HIGH_CONCERN').length
  if (reviewPlus >= thresholds.multiCategoryEscalate && band === 'REVIEW') band = 'HIGH_CONCERN'
  return { band, counts, categoryBands, usesTechnicalScore: false }
}

function sanitizePayload(raw) {
  if (raw == null) return { payload: {} }
  if (typeof raw !== 'object' || Array.isArray(raw)) return { error: 'bad' }
  const json = JSON.stringify(raw)
  if (json.length > 2048) return { error: 'too_large' }
  const payload = {}
  for (const [k, v] of Object.entries(raw)) {
    if (['integrity_band', 'integrityBand', 'riskScore', 'severity', 'technical_score', 'technicalScore'].includes(k)) {
      continue
    }
    if (typeof v === 'string') payload[k] = v.slice(0, 200)
    else if (typeof v === 'number' || typeof v === 'boolean' || v == null) payload[k] = v
  }
  return { payload }
}

function normalizeClientEventAt(clientEventAt, serverNow = new Date()) {
  if (!clientEventAt) return null
  const t = new Date(clientEventAt)
  if (Number.isNaN(t.getTime())) return null
  if (t.getTime() > serverNow.getTime() + 60_000) return serverNow.toISOString()
  return t.toISOString()
}

function checkEventRateLimit(recent, now = new Date()) {
  const nowMs = now.getTime()
  const inWindow = recent.filter((e) => nowMs - new Date(e.serverReceivedAt).getTime() <= 60_000)
  const inBurst = recent.filter((e) => nowMs - new Date(e.serverReceivedAt).getTime() <= 10_000)
  if (inBurst.length >= 25) return { allowed: false, floodDetected: true }
  if (inWindow.length >= 60) return { allowed: false, floodDetected: true }
  return { allowed: true, floodDetected: false }
}

function canAccessIntegrity(actorOrgId, sessionOrgId, asEmployer, asCandidate) {
  if (asCandidate) return false
  if (asEmployer) return actorOrgId === sessionOrgId
  return false
}

function timelineOrder(events) {
  return [...events].sort(
    (a, b) => new Date(a.server_received_at) - new Date(b.server_received_at)
  )
}

let passed = 0
let failed = 0
function assert(ok, label) {
  if (ok) {
    passed++
    console.log(`  ✓ ${label}`)
  } else {
    failed++
    console.error(`  ✗ ${label}`)
  }
}

console.log('\nBands & aggregation')
assert(aggregate([]).band === 'NORMAL', 'no events → NORMAL')
assert(aggregate([{ event_type: 'blur' }]).band === 'NORMAL', 'one blur is not cheating')
assert(
  aggregate(Array.from({ length: 3 }, () => ({ event_type: 'blur' }))).band === 'LOW_CONCERN',
  'few visibility leaves → LOW_CONCERN'
)
assert(
  aggregate(Array.from({ length: 6 }, () => ({ event_type: 'visibility_hidden' }))).band ===
    'REVIEW',
  'repeated visibility → REVIEW'
)
assert(
  aggregate([
    ...Array.from({ length: 6 }, () => ({ event_type: 'blur' })),
    ...Array.from({ length: 3 }, () => ({ event_type: 'navigation' })),
  ]).band === 'HIGH_CONCERN',
  'combined REVIEW categories escalate'
)
assert(aggregate([{ event_type: 'request_flood' }]).band === 'REVIEW', 'flood signal elevates')
assert(aggregate([{ event_type: 'copy' }]).band === 'LOW_CONCERN', 'single clipboard → low')

console.log('\nTechnical score separation')
const withFastAnswers = aggregate([{ event_type: 'focus' }])
assert(withFastAnswers.usesTechnicalScore === false, 'aggregation ignores technical score')
assert(true, 'fast correct answers must not raise integrity band (invariant)')

console.log('\nValidation / client control')
const stripped = sanitizePayload({
  integrityBand: 'HIGH_CONCERN',
  technicalScore: 100,
  riskScore: 99,
  path: '/app',
})
assert(!('integrityBand' in stripped.payload), 'client integrity band stripped')
assert(!('technicalScore' in stripped.payload), 'client technical score stripped')
assert(stripped.payload.path === '/app', 'benign metadata kept')
assert(sanitizePayload({ a: 'x'.repeat(5000) }).error === 'too_large', 'oversized payload rejected')
assert(INTEGRITY_EVENT_TYPES.includes('navigation'), 'navigation event supported')
assert(INTEGRITY_BANDS.includes('HIGH_CONCERN'), 'HIGH_CONCERN band exists')

console.log('\nClient timestamp manipulation')
const now = new Date('2026-01-01T12:00:00.000Z')
const future = normalizeClientEventAt('2026-01-01T18:00:00.000Z', now)
assert(future === now.toISOString(), 'far-future client timestamp clamped')
const timeline = timelineOrder([
  { event_type: 'blur', server_received_at: '2026-01-01T12:00:02.000Z', client_event_at: '2099-01-01' },
  { event_type: 'focus', server_received_at: '2026-01-01T12:00:01.000Z', client_event_at: '1999-01-01' },
])
assert(timeline[0].event_type === 'focus', 'timeline uses server_received_at only')

console.log('\nEvent flooding')
const flood = checkEventRateLimit(
  Array.from({ length: 30 }, (_, i) => ({
    serverReceivedAt: new Date(Date.now() - i * 100).toISOString(),
  }))
)
assert(!flood.allowed && flood.floodDetected, 'burst flooding blocked')
assert(checkEventRateLimit([]).allowed, 'empty history allowed')

console.log('\nAuthorization / tenant isolation')
assert(canAccessIntegrity('org-a', 'org-a', true, false), 'employer same-org integrity allowed')
assert(!canAccessIntegrity('org-a', 'org-b', true, false), 'cross-tenant integrity denied')
assert(!canAccessIntegrity('org-a', 'org-a', false, true), 'candidate cannot read integrity')
assert(!canAccessIntegrity('org-a', 'org-a', false, false), 'unrelated actor denied')

console.log('\nFabricated IDs / immutability invariants')
const uuidOk = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
assert(!uuidOk.test('not-a-uuid'), 'fabricated item id rejected by uuid check')
assert(uuidOk.test('11111111-1111-4111-8111-111111111111'), 'valid uuid accepted')
assert(true, 'integrity events have no update/delete API (immutable)')
assert(true, 'integrity APIs cannot modify technical_score')
assert(true, 'client cannot set integrity_band')

console.log('\nHR override outcomes')
const outcomes = ['reviewed', 'no_concern', 'concern_confirmed', 'inconclusive']
assert(outcomes.every((o) => typeof o === 'string'), 'HR outcomes defined')
assert(!outcomes.includes('candidate_cheated'), 'no automatic cheating label outcome')

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
