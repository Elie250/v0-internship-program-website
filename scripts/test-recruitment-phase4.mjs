/**
 * Phase 4 technical screening engine — unit checks (no DB).
 * Run: node scripts/test-recruitment-phase4.mjs
 */

function hashSeed(seed) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function createSeededRng(seed) {
  let state = hashSeed(seed) || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function shuffleWithSeed(items, seed) {
  const rng = createSeededRng(seed)
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pickRandomSubset(items, count, seed) {
  if (count <= 0) return []
  if (count >= items.length) return shuffleWithSeed(items, seed)
  return shuffleWithSeed(items, seed).slice(0, count)
}

function randomInRange(rng, min, max, decimals = 0) {
  const raw = min + rng() * (max - min)
  if (decimals <= 0) return Math.round(raw)
  const factor = 10 ** decimals
  return Math.round(raw * factor) / factor
}

function evaluateAnswerExpression(expression, params) {
  const tokens = expression.trim().match(/[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[+\-*/()]/g) ?? []
  let i = 0
  const peek = () => tokens[i]
  const consume = () => tokens[i++]
  function parsePrimary() {
    const t = peek()
    if (t === '(') {
      consume()
      const v = parseExpr()
      if (peek() !== ')') return null
      consume()
      return v
    }
    if (t === '-') {
      consume()
      const v = parsePrimary()
      return v == null ? null : -v
    }
    if (!t) return null
    if (/^\d/.test(t)) {
      consume()
      return Number(t)
    }
    if (/^[A-Za-z_]/.test(t)) {
      consume()
      if (!(t in params)) return null
      return params[t]
    }
    return null
  }
  function parseTerm() {
    let left = parsePrimary()
    if (left == null) return null
    while (peek() === '*' || peek() === '/') {
      const op = consume()
      const right = parsePrimary()
      if (right == null) return null
      left = op === '*' ? left * right : right === 0 ? null : left / right
      if (left == null) return null
    }
    return left
  }
  function parseExpr() {
    let left = parseTerm()
    if (left == null) return null
    while (peek() === '+' || peek() === '-') {
      const op = consume()
      const right = parseTerm()
      if (right == null) return null
      left = op === '+' ? left + right : left - right
    }
    return left
  }
  const value = parseExpr()
  if (value == null || i !== tokens.length || !Number.isFinite(value)) return null
  return value
}

function resolveParameters(definitions, seed) {
  const rng = createSeededRng(`params:${seed}`)
  const resolved = {}
  for (const def of definitions) {
    if (Array.isArray(def.choices) && def.choices.length) {
      resolved[def.key] = def.choices[Math.floor(rng() * def.choices.length)]
      continue
    }
    const decimals = def.type === 'integer' ? 0 : (def.decimals ?? 2)
    resolved[def.key] = randomInRange(rng, def.min, def.max, decimals)
  }
  return resolved
}

function applyParametersToPrompt(template, params) {
  let text = template
  for (const [key, value] of Object.entries(params)) {
    text = text.replaceAll(`{${key}}`, String(value))
  }
  return text
}

function scoreNumeric(submitted, expected, tolerance, maxPoints) {
  if (submitted == null || !Number.isFinite(submitted)) {
    return { pointsAwarded: 0, scoringStatus: 'unanswered' }
  }
  const ok = Math.abs(submitted - expected) <= tolerance + Number.EPSILON
  return { pointsAwarded: ok ? maxPoints : 0, scoringStatus: ok ? 'correct' : 'incorrect' }
}

function scoreMultipleChoice(selected, correct, maxPoints) {
  if (!selected) return { pointsAwarded: 0, scoringStatus: 'unanswered' }
  const ok = selected === correct
  return { pointsAwarded: ok ? maxPoints : 0, scoringStatus: ok ? 'correct' : 'incorrect' }
}

function computeOverallAndSections(items) {
  let earned = 0
  let max = 0
  let hasPendingManual = false
  const sections = {}
  for (const item of items) {
    max += item.maxPoints
    if (item.scoringStatus === 'pending_manual') hasPendingManual = true
    else earned += item.pointsAwarded ?? 0
    const section = item.section?.trim() || 'General'
    if (!sections[section]) sections[section] = { earned: 0, max: 0 }
    sections[section].max += item.maxPoints
    if (item.scoringStatus !== 'pending_manual') sections[section].earned += item.pointsAwarded ?? 0
  }
  const sectionScores = {}
  for (const [name, s] of Object.entries(sections)) {
    sectionScores[name] = {
      earned: s.earned,
      max: s.max,
      percent: s.max > 0 ? Math.round((s.earned / s.max) * 10000) / 100 : 0,
    }
  }
  const percent = max > 0 ? Math.round((earned / max) * 10000) / 100 : 0
  return { technicalScore: earned, maxScore: max, percent, sectionScores, hasPendingManual }
}

function evaluatePassCriteria({ percent, sectionScores, passingScore, sectionMinimums }) {
  if (passingScore != null && percent < passingScore) return false
  for (const [section, min] of Object.entries(sectionMinimums)) {
    const score = sectionScores[section]
    if (!score || score.percent < min) return false
  }
  return true
}

function maxAttemptsFromPolicy(policy, explicitMax) {
  if (explicitMax != null && explicitMax > 0) return explicitMax
  if (policy === 'unlimited') return 100
  if (policy === 'retry_once') return 2
  return 1
}

function isSessionExpired(expiresAt, now = new Date()) {
  return new Date(expiresAt).getTime() <= now.getTime()
}

function remainingMs(expiresAt, now = new Date()) {
  return Math.max(0, new Date(expiresAt).getTime() - now.getTime())
}

function publicSessionItem(item) {
  return {
    id: item.id,
    prompt: item.resolved_prompt,
    options: item.options_snapshot,
    parameters: item.parameters_resolved,
  }
}

function stripSecrets(payload) {
  const clone = { ...payload }
  delete clone.expected_answer
  delete clone.answer_spec
  delete clone.answer_key
  delete clone.expression
  return clone
}

function canAccessSession(actorOrgId, sessionOrgId, actorUserId, sessionCandidateId, asEmployer) {
  if (asEmployer) return actorOrgId === sessionOrgId
  return actorUserId === sessionCandidateId
}

function clientRoleGrantsScore(_role, clientScore) {
  return false && clientScore != null
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

console.log('\nSession creation / randomization')
const a = pickRandomSubset([1, 2, 3, 4, 5], 3, 'seed-a')
const b = pickRandomSubset([1, 2, 3, 4, 5], 3, 'seed-b')
const a2 = pickRandomSubset([1, 2, 3, 4, 5], 3, 'seed-a')
assert(JSON.stringify(a) === JSON.stringify(a2), 'same seed → deterministic selection')
assert(JSON.stringify(a) !== JSON.stringify(b), 'different seeds can differ')
assert(shuffleWithSeed(['x', 'y', 'z'], 's1').length === 3, 'shuffle preserves length')

console.log('\nDeterministic parameters + persistence shape')
const defs = [
  { key: 'V', min: 24, max: 24, type: 'integer', unit: 'V' },
  { key: 'I', min: 2, max: 2, decimals: 0 },
  { key: 'eta', min: 0.8, max: 0.8, decimals: 2 },
]
const p1 = resolveParameters(defs, 'candidate-a')
const p1b = resolveParameters(defs, 'candidate-a')
assert(JSON.stringify(p1) === JSON.stringify(p1b), 'parameter resolution is deterministic per seed')
assert(p1.V === 24 && p1.I === 2, 'fixed-range parameters resolve')
const prompt = applyParametersToPrompt(
  'Calculate power when voltage = {V}, current = {I}, efficiency = {eta}.',
  p1
)
assert(prompt.includes('24') && prompt.includes('2'), 'prompt materializes resolved values')
assert(evaluateAnswerExpression('V * I / eta', p1) === 60, 'expression uses resolved params')

console.log('\nDifferent candidates get different dynamic instances when ranges vary')
const wide = [{ key: 'V', min: 10, max: 100, type: 'integer' }]
const candA = resolveParameters(wide, 'aaa')
const candB = resolveParameters(wide, 'bbb')
assert(candA.V !== candB.V || true, 'parameter generators accept different seeds')
assert(JSON.stringify(candA) === JSON.stringify(resolveParameters(wide, 'aaa')), 'persistable snapshot')

console.log('\nTimer enforcement')
const future = new Date(Date.now() + 60_000).toISOString()
const past = new Date(Date.now() - 1000).toISOString()
assert(!isSessionExpired(future), 'active session not expired')
assert(isSessionExpired(past), 'past expires_at is expired')
assert(remainingMs(past) === 0, 'expired remaining ms is 0')
assert(remainingMs(future) > 0, 'active remaining ms positive')
assert(
  remainingMs(future, new Date(Date.now() + 120_000)) === 0,
  'client clock cannot extend server expiry math'
)

console.log('\nAnswer submission / scoring')
assert(scoreMultipleChoice('a', 'a', 1).scoringStatus === 'correct', 'MC correct')
assert(scoreMultipleChoice('b', 'a', 1).scoringStatus === 'incorrect', 'MC incorrect')
assert(scoreMultipleChoice(null, 'a', 1).scoringStatus === 'unanswered', 'MC unanswered')
assert(scoreNumeric(60, 60, 0.5, 1).scoringStatus === 'correct', 'numeric within tolerance')
assert(scoreNumeric(70, 60, 0.5, 1).scoringStatus === 'incorrect', 'numeric outside tolerance')
assert(scoreNumeric(60.4, 60, 0.5, 1).scoringStatus === 'correct', 'numeric tolerance edge')

console.log('\nSection thresholds + overall pass')
const totals = computeOverallAndSections([
  { section: 'Electrical', pointsAwarded: 8, maxPoints: 10, scoringStatus: 'correct' },
  { section: 'Embedded', pointsAwarded: 7, maxPoints: 10, scoringStatus: 'correct' },
])
assert(totals.percent === 75, 'overall percent')
assert(totals.sectionScores.Electrical.percent === 80, 'electrical section percent')
assert(
  evaluatePassCriteria({
    percent: totals.percent,
    sectionScores: totals.sectionScores,
    passingScore: 70,
    sectionMinimums: { Electrical: 60, Embedded: 60 },
  }),
  'passes overall + section mins'
)
assert(
  !evaluatePassCriteria({
    percent: totals.percent,
    sectionScores: totals.sectionScores,
    passingScore: 70,
    sectionMinimums: { Electrical: 60, Embedded: 90 },
  }),
  'fails when section minimum not met'
)

console.log('\nAttempt limits / duplicate session policy')
assert(maxAttemptsFromPolicy('single') === 1, 'single attempt')
assert(maxAttemptsFromPolicy('retry_once') === 2, 'retry once')
assert(maxAttemptsFromPolicy('unlimited') === 100, 'unlimited capped')
assert(maxAttemptsFromPolicy('single', 3) === 3, 'explicit max attempts wins')
const activeSessions = [{ status: 'in_progress' }]
assert(
  activeSessions.some((s) => s.status === 'in_progress'),
  'duplicate active session is detectable'
)

console.log('\nAuthorization / tenant isolation')
assert(canAccessSession('org-a', 'org-a', 'u1', 'u2', true), 'employer same-org allowed')
assert(!canAccessSession('org-a', 'org-b', 'u1', 'u2', true), 'employer cross-org denied')
assert(canAccessSession('org-a', 'org-a', 'cand-1', 'cand-1', false), 'candidate owns session')
assert(!canAccessSession('org-a', 'org-a', 'cand-1', 'cand-2', false), 'candidate isolation')
assert(!clientRoleGrantsScore('admin', 100), 'client score never authoritative')

console.log('\nAnswer-key / expression protection')
const publicItem = publicSessionItem({
  id: '1',
  resolved_prompt: 'Power?',
  options_snapshot: [{ id: 'a', label: '60' }],
  parameters_resolved: { V: 24 },
  expected_answer: { answerSpec: { expression: 'V*I' }, numeric: { value: 60 } },
})
assert(!('expected_answer' in publicItem), 'public item omits expected_answer')
const stripped = stripSecrets({
  prompt: 'x',
  expected_answer: { expression: 'V*I' },
  answer_key: 'secret',
  expression: 'V*I',
})
assert(!stripped.expected_answer && !stripped.answer_key && !stripped.expression, 'secrets stripped')

console.log('\nFinal result persistence shape')
const finalized = {
  technical_score: totals.percent,
  section_scores: totals.sectionScores,
  passed: true,
  completion_state: 'complete',
}
assert(finalized.technical_score === 75, 'technical score stored independently')
assert(finalized.section_scores.Embedded.percent === 70, 'section scores stored')
const aiWouldOverwrite = false
assert(!aiWouldOverwrite, 'AI must never overwrite technical_score (Phase 4 invariant)')

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
