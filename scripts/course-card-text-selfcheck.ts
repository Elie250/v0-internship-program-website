import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeCourseCardDescription } from '../lib/learning/course-card-text.ts'

test('collapses CRLF, LF and repeated spaces into one paragraph', () => {
  assert.equal(
    normalizeCourseCardDescription('Hands-on\r\ntraining\nin Kigali.\n\nApply now.'),
    'Hands-on training in Kigali. Apply now.'
  )
})

test('strips pasted HTML without changing the stored source', () => {
  assert.equal(
    normalizeCourseCardDescription('<p>Power&nbsp;systems</p><br/><b>lab</b>'),
    'Power systems lab'
  )
})

test('treats empty and null values as blank', () => {
  assert.equal(normalizeCourseCardDescription(null), '')
  assert.equal(normalizeCourseCardDescription('   '), '')
})
