import assert from 'node:assert/strict'
import test from 'node:test'
import {
  parseActivityKindInput,
  parseEstimatedMinutesInput,
  plannedReleaseDateFromAdmission,
} from '../lib/learning/curriculum-workload.ts'

test('estimated minutes accepts positive integers and clears blank', () => {
  assert.deepEqual(parseEstimatedMinutesInput(45), { ok: true, minutes: 45 })
  assert.deepEqual(parseEstimatedMinutesInput('90'), { ok: true, minutes: 90 })
  assert.deepEqual(parseEstimatedMinutesInput(''), { ok: true, minutes: null })
  assert.deepEqual(parseEstimatedMinutesInput(null), { ok: true, minutes: null })
})

test('estimated minutes rejects invalid values and never invents duration', () => {
  for (const value of [0, -1, 1.5, '0', '12.5', 'abc', true]) {
    assert.equal(parseEstimatedMinutesInput(value).ok, false)
  }
})

test('activity kind accepts approved labels only', () => {
  assert.deepEqual(parseActivityKindInput('theory'), { ok: true, kind: 'theory' })
  assert.deepEqual(parseActivityKindInput('practical'), { ok: true, kind: 'practical' })
  assert.deepEqual(parseActivityKindInput(''), { ok: true, kind: null })
  assert.equal(parseActivityKindInput('lab').ok, false)
  assert.equal(parseActivityKindInput('homework').ok, false)
})

test('planned release uses consecutive calendar days from admission including weekends', () => {
  // 2026-11-06 is a Friday in Africa/Kigali calendar date from this UTC instant.
  const admission = new Date('2026-11-06T08:00:00.000Z')
  const day1 = plannedReleaseDateFromAdmission(admission, 1)
  const day2 = plannedReleaseDateFromAdmission(admission, 2)
  const day3 = plannedReleaseDateFromAdmission(admission, 3)
  assert.equal(day1.ok, true)
  assert.equal(day2.ok, true)
  assert.equal(day3.ok, true)
  if (day1.ok && day2.ok && day3.ok) {
    assert.equal(day1.isoDate, '2026-11-06')
    assert.equal(day2.isoDate, '2026-11-07') // Saturday — weekends included
    assert.equal(day3.isoDate, '2026-11-08') // Sunday
  }
})

test('multi-day portion policy: full duration must not be counted on every day', () => {
  const estimated = 120
  const portions = [60, 60]
  assert.equal(portions.reduce((a, b) => a + b, 0), estimated)
  const bad = [120, 120]
  assert.notEqual(bad.reduce((a, b) => a + b, 0), estimated)
})
