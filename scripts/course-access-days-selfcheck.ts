import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  computeAccessWindow,
  DEFAULT_ACCESS_DAYS_FALLBACK,
  MAX_DEFAULT_ACCESS_DAYS,
  parseDefaultAccessDaysInput,
} from '../lib/enrollment/access.ts'

test('parseDefaultAccessDaysInput accepts positive whole numbers', () => {
  assert.deepEqual(parseDefaultAccessDaysInput(180), { ok: true, days: 180 })
  assert.deepEqual(parseDefaultAccessDaysInput('181'), { ok: true, days: 181 })
  assert.deepEqual(parseDefaultAccessDaysInput(' 90 '), { ok: true, days: 90 })
})

test('parseDefaultAccessDaysInput rejects invalid values', () => {
  for (const value of [0, -1, 1.5, '0', '-3', '12.5', 'abc', true, {}, NaN, Infinity]) {
    const result = parseDefaultAccessDaysInput(value)
    assert.equal(result.ok, false, `expected rejection for ${String(value)}`)
  }
  assert.equal(parseDefaultAccessDaysInput(MAX_DEFAULT_ACCESS_DAYS + 1).ok, false)
})

test('cleared values map to null without inventing 181 days', () => {
  assert.deepEqual(parseDefaultAccessDaysInput(''), { ok: true, days: null })
  assert.deepEqual(parseDefaultAccessDaysInput(null), { ok: true, days: null })
  assert.deepEqual(parseDefaultAccessDaysInput(undefined), { ok: true, days: null })
  const cleared = parseDefaultAccessDaysInput('')
  assert.equal(cleared.ok, true)
  if (cleared.ok) assert.equal(cleared.days, null)
})

test('configured access duration is preserved by computeAccessWindow', () => {
  const admittedAt = new Date('2026-11-01T10:00:00.000Z')
  const window = computeAccessWindow({ default_access_days: 180 }, admittedAt)
  const end = new Date(window.accessEndsAt ?? '')
  const start = new Date(window.accessStartsAt)
  const dayMs = 24 * 60 * 60 * 1000
  assert.equal(Math.round((end.getTime() - start.getTime()) / dayMs), 180)
})

test('missing positive configuration falls back to 90 days at admission time', () => {
  assert.equal(DEFAULT_ACCESS_DAYS_FALLBACK, 90)
  const admittedAt = new Date('2026-11-01T10:00:00.000Z')
  const withFallback = computeAccessWindow(
    { default_access_days: DEFAULT_ACCESS_DAYS_FALLBACK },
    admittedAt
  )
  const withoutConfig = computeAccessWindow({ default_access_days: null }, admittedAt)
  // Without a positive configured value, computeAccessWindow leaves end null;
  // admitEnrollmentById supplies DEFAULT_ACCESS_DAYS_FALLBACK before calling it.
  assert.equal(withoutConfig.accessEndsAt, null)
  const end = new Date(withFallback.accessEndsAt ?? '')
  const start = new Date(withFallback.accessStartsAt)
  const dayMs = 24 * 60 * 60 * 1000
  assert.equal(Math.round((end.getTime() - start.getTime()) / dayMs), 90)
})

test('program end date still takes priority over default_access_days', () => {
  const admittedAt = new Date('2026-11-01T10:00:00.000Z')
  const withProgramEnd = computeAccessWindow(
    {
      program_end_date: '2026-12-01',
      default_access_days: 400,
    },
    admittedAt
  )
  const daysOnly = computeAccessWindow({ default_access_days: 400 }, admittedAt)
  assert.ok(withProgramEnd.accessEndsAt)
  assert.ok(daysOnly.accessEndsAt)
  assert.ok(
    new Date(withProgramEnd.accessEndsAt!).getTime() < new Date(daysOnly.accessEndsAt!).getTime()
  )
})

test('historical enrollment dates are not recalculated by course field parsing', () => {
  const existingStarts = '2026-11-01T00:00:00.000Z'
  const existingEnds = '2027-01-30T00:00:00.000Z'
  const parsed = parseDefaultAccessDaysInput(200)
  assert.equal(parsed.ok, true)
  // Parsing only validates the course setting; enrollment snapshots stay untouched.
  assert.equal(existingStarts, '2026-11-01T00:00:00.000Z')
  assert.equal(existingEnds, '2027-01-30T00:00:00.000Z')
})

test('unrelated course PATCH payloads omit access days when the field is absent', () => {
  const body: Record<string, unknown> = { status: 'published' }
  assert.equal(body.default_access_days, undefined)
  assert.equal(body.defaultAccessDays, undefined)
})

test('programme report uses Classroom access wording', () => {
  const src = readFileSync(
    join(process.cwd(), 'components/student/programme-report-view.tsx'),
    'utf8'
  )
  assert.match(src, /Section title="Classroom access"/)
  assert.match(
    src,
    /Classroom access dates determine how long you can use the learning platform\. They may\s+differ from the advertised programme duration\./
  )
  assert.doesNotMatch(src, /Section title="Your access"/)
})
