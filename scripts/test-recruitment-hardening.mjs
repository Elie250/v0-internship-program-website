/**
 * Unit tests for Phase 1 recruitment hardening (no DB required).
 * Run: node scripts/test-recruitment-hardening.mjs
 */

import crypto from 'crypto'

// --- email-normalize (inlined mirror for standalone run) ---
function normalizeRecruitmentEmail(raw) {
  const normalized = raw.trim().toLowerCase()
  if (!normalized) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null
  return normalized
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function hashClientIp(ip) {
  return crypto.createHash('sha256').update(ip.trim() || 'unknown').digest('hex')
}

let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) {
    passed++
    console.log(`  ✓ ${label}`)
  } else {
    failed++
    console.error(`  ✗ ${label}`)
  }
}

console.log('\nEmail normalization (W2/W11)')
assert(normalizeRecruitmentEmail('  User@Example.COM  ') === 'user@example.com', 'trim + lowercase')
assert(normalizeRecruitmentEmail('bad') === null, 'reject invalid')
assert(normalizeRecruitmentEmail('a@b.c') === 'a@b.c', 'accept minimal valid')
assert(normalizeRecruitmentEmail('') === null, 'reject empty')

console.log('\nToken hashing (W5)')
const t1 = crypto.randomBytes(32).toString('hex')
const t2 = crypto.randomBytes(32).toString('hex')
assert(hashToken(t1) === hashToken(t1), 'deterministic hash')
assert(hashToken(t1) !== hashToken(t2), 'different tokens differ')
assert(hashToken(t1).length === 64, 'sha256 hex length')

console.log('\nIP hashing (W1)')
assert(hashClientIp('1.2.3.4') === hashClientIp('1.2.3.4'), 'deterministic IP hash')
assert(hashClientIp('1.2.3.4') !== hashClientIp('5.6.7.8'), 'different IPs differ')

console.log('\nOrg status governance (W7) — logic check')
function resolvePatchStatus(asPlatformAdmin, bodyStatus) {
  return asPlatformAdmin && bodyStatus !== undefined ? bodyStatus : undefined
}
assert(resolvePatchStatus(false, 'suspended') === undefined, 'org admin cannot set status')
assert(resolvePatchStatus(true, 'active') === 'active', 'platform admin can set status')
assert(resolvePatchStatus(false, undefined) === undefined, 'no status when omitted')

console.log('\nPublic org response (W8) — shape check')
function publicOrgShape(org) {
  return {
    name: org.name,
    slug: org.slug,
    description: org.description,
    logo_url: org.logo_url,
    careers_blurb: org.careers_blurb,
  }
}
const shaped = publicOrgShape({
  id: 'secret-uuid',
  name: 'EasyFab',
  slug: 'easyfab',
  description: null,
  logo_url: null,
  careers_blurb: 'Join us',
  notification_email: 'hr@easyfab.com',
})
assert(!('id' in shaped), 'public shape excludes id')
assert(!('notification_email' in shaped), 'public shape excludes notification_email')
assert(shaped.slug === 'easyfab', 'public shape keeps slug')

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
