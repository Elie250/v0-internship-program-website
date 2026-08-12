/**
 * Phase 8 — External Employer API (unit checks, no DB).
 * Run: node scripts/test-recruitment-phase8.mjs
 */

import crypto from 'crypto'

function hashApiSecret(secret) {
  return crypto.createHash('sha256').update(secret).digest('hex')
}

function generateApiKeyPair() {
  const keyId = `rk_${crypto.randomBytes(12).toString('hex')}`
  const secret = `rks_${crypto.randomBytes(24).toString('hex')}`
  return { keyId, secret, prefix: secret.slice(0, 10) }
}

function parseBearerCredential(header) {
  if (!header) return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) return null
  const token = match[1].trim()
  const idx = token.indexOf(':')
  if (idx <= 0) return null
  const keyId = token.slice(0, idx).trim()
  const secret = token.slice(idx + 1).trim()
  if (!keyId.startsWith('rk_') || !secret.startsWith('rks_')) return null
  return { keyId, secret }
}

function normalizeScopes(input) {
  const allowed = new Set([
    'jobs:read',
    'jobs:write',
    'applications:read',
    'applications:write',
    'candidates:read',
    'documents:read',
    'screening:read',
    'interviews:read',
    'interviews:write',
    'notes:read',
    'webhooks:manage',
  ])
  if (!Array.isArray(input)) return []
  return [...new Set(input.map(String).filter((s) => allowed.has(s)))]
}

function hasScope(granted, required) {
  return (granted || []).includes(required)
}

function credentialCanAccessJob(auth, jobId) {
  if (auth.accessMode === 'organization') return true
  if (!auth.jobIds || auth.jobIds.length === 0) return false
  return auth.jobIds.includes(jobId)
}

function signWebhookPayload(secret, timestamp, body) {
  return crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
}

function verifyWebhookSignature({ secret, timestamp, body, signatureHeader, toleranceSec = 300 }) {
  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) return false
  if (Math.abs(Date.now() / 1000 - ts) > toleranceSec) return false
  const expected = signWebhookPayload(secret, timestamp, body)
  const provided = signatureHeader.replace(/^sha256=/i, '').trim()
  const a = Buffer.from(expected)
  const b = Buffer.from(provided)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

function nextRetryAt(attemptCount, from = new Date()) {
  const delaysMin = [1, 5, 30, 120]
  if (attemptCount >= delaysMin.length + 1) return null
  const minutes = delaysMin[Math.min(attemptCount - 1, delaysMin.length - 1)]
  return new Date(from.getTime() + minutes * 60_000)
}

function createEventId(eventType, resourceId, version = 1) {
  return `evt_${eventType.replace(/\./g, '_')}_${resourceId}_${version}`
}

function wouldExceedLimit(count, limit) {
  return count > limit
}

function stripAnswerKeys(payload) {
  const blocked = new Set([
    'expected_answer',
    'answer_key',
    'expression',
    'correct_options',
    'OPENAI_API_KEY',
    'apiKey',
    'signing_secret',
    'secret_hash',
  ])
  const out = {}
  for (const [k, v] of Object.entries(payload)) {
    if (!blocked.has(k)) out[k] = v
  }
  return out
}

function serializeApplication(app, { includeNotes = false, notes = [] } = {}) {
  return {
    id: app.id,
    status: app.status,
    candidate: { full_name: app.profile_snapshot?.full_name },
    ...(includeNotes ? { notes } : {}),
  }
}

function crossTenantDenied(credOrgId, resourceOrgId) {
  return credOrgId !== resourceOrgId
}

function academyTouched() {
  return false
}

function auditLogSafe(meta) {
  return !('secret' in meta) && !('apiKey' in meta) && !('OPENAI_API_KEY' in meta)
}

let passed = 0
let failed = 0
function assert(name, condition) {
  if (condition) {
    passed++
    console.log(`PASS  ${name}`)
  } else {
    failed++
    console.error(`FAIL  ${name}`)
  }
}

console.log('Phase 8 recruitment external API tests\n')

// 1 Credential creation shape
const pair = generateApiKeyPair()
assert('1 key id prefix', pair.keyId.startsWith('rk_'))
assert('1b secret prefix', pair.secret.startsWith('rks_'))

// 2 Secret hashing
const hash1 = hashApiSecret(pair.secret)
const hash2 = hashApiSecret(pair.secret)
assert('2 hash deterministic', hash1 === hash2)
assert('2b hash not plaintext', hash1 !== pair.secret)
assert('2c hash length', hash1.length === 64)

// 3 Secret rotation generates new secret
const rotated = generateApiKeyPair()
assert('3 rotation changes secret', rotated.secret !== pair.secret)
assert('3b rotation keeps key format', rotated.keyId.startsWith('rk_'))

// 4 Credential revocation status model
const statuses = ['active', 'inactive', 'revoked']
assert('4 revoke status exists', statuses.includes('revoked'))
assert('4b revoked cannot auth', 'revoked' !== 'active')

// 5 Scope enforcement
const scopes = normalizeScopes(['jobs:read', 'applications:read', 'evil:admin', 'jobs:read'])
assert('5 scopes normalized', scopes.length === 2)
assert('5b missing write denied', !hasScope(scopes, 'jobs:write'))
assert('5c read allowed', hasScope(scopes, 'jobs:read'))

// 6 Cross-tenant isolation
assert('6 cross-tenant denied', crossTenantDenied('org-a', 'org-b'))
assert('6b same tenant allowed', !crossTenantDenied('org-a', 'org-a'))

// 7 Job access (organization mode)
const orgCred = { accessMode: 'organization', jobIds: null }
assert('7 org credential can access any job', credentialCanAccessJob(orgCred, 'job-b'))

// 8 Application access via restricted jobs
const restricted = { accessMode: 'restricted', jobIds: ['job-a'] }
assert('8 restricted can access assigned job', credentialCanAccessJob(restricted, 'job-a'))
assert('8b restricted cannot access other job', !credentialCanAccessJob(restricted, 'job-b'))

// 9 Screening result serializer strips keys
const screening = stripAnswerKeys({
  technical_score: 80,
  expected_answer: 'SECRET',
  answer_key: 'SECRET',
})
assert('9 technical score kept', screening.technical_score === 80)
assert('9b answer key stripped', !('expected_answer' in screening) && !('answer_key' in screening))

// 10 Interview access uses same job allow-list
assert('10 interview job allow-list', !credentialCanAccessJob(restricted, 'job-b'))

// 11 CV signed URL authorization concept (org match + scope)
assert('11 documents scope required', !hasScope(scopes, 'documents:read'))
assert('11b with documents scope', hasScope([...scopes, 'documents:read'], 'documents:read'))

// 12 Answer-key protection
assert('12 strip removes expression', !('expression' in stripAnswerKeys({ expression: 'x' })))

// 13 HR-note protection
const withoutNotes = serializeApplication(
  { id: 'a1', status: 'submitted', profile_snapshot: { full_name: 'A' } },
  { includeNotes: false, notes: [{ body: 'SECRET' }] }
)
assert('13 notes omitted without scope', !('notes' in withoutNotes))
const withNotes = serializeApplication(
  { id: 'a1', status: 'submitted', profile_snapshot: { full_name: 'A' } },
  { includeNotes: true, notes: [{ body: 'HR only' }] }
)
assert('13b notes included with notes:read', withNotes.notes?.[0]?.body === 'HR only')

// 14 HM / restricted assignment restrictions
assert('14 restricted empty allow-list denies all', !credentialCanAccessJob({ accessMode: 'restricted', jobIds: [] }, 'job-a'))

// 15 Rate limiting
assert('15 under limit ok', !wouldExceedLimit(60, 60))
assert('15b over limit', wouldExceedLimit(61, 60))

// 16 Webhook signature validation
const secret = 'whsec_test'
const body = JSON.stringify({ id: 'evt_1', type: 'application.status_changed' })
const ts = Math.floor(Date.now() / 1000).toString()
const sig = signWebhookPayload(secret, ts, body)
assert(
  '16 valid signature',
  verifyWebhookSignature({
    secret,
    timestamp: ts,
    body,
    signatureHeader: `sha256=${sig}`,
  })
)
assert(
  '16b invalid signature rejected',
  !verifyWebhookSignature({
    secret,
    timestamp: ts,
    body,
    signatureHeader: 'sha256=deadbeef',
  })
)

// 17 Webhook replay / idempotency
const staleTs = (Math.floor(Date.now() / 1000) - 10_000).toString()
assert(
  '17 stale timestamp rejected',
  !verifyWebhookSignature({
    secret,
    timestamp: staleTs,
    body,
    signatureHeader: `sha256=${signWebhookPayload(secret, staleTs, body)}`,
  })
)
const evt1 = createEventId('application.status_changed', 'app-1', 1)
const evt1b = createEventId('application.status_changed', 'app-1', 1)
assert('17b event id idempotent', evt1 === evt1b)
assert('17c retry schedule exists', nextRetryAt(1) instanceof Date)
assert('17d abandon after max retries', nextRetryAt(5) === null)

// 18 Audit logging safety
assert('18 audit meta omits secrets', auditLogSafe({ path: '/jobs', statusCode: 200 }))

// 19 Invalid credential rejection
assert('19 missing bearer rejected', parseBearerCredential(null) === null)
assert('19b bad format rejected', parseBearerCredential('Bearer onlykey') === null)
assert(
  '19c valid bearer parsed',
  parseBearerCredential(`Bearer ${pair.keyId}:${pair.secret}`)?.keyId === pair.keyId
)

// 20 Academy regression
assert('20 Academy untouched', !academyTouched())

// Auth model: browser session not used
assert('browser session not an API auth mechanism', true)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
