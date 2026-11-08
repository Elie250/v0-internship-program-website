import assert from 'node:assert/strict'
import test from 'node:test'
import {
  decideProgrammeReportAccess,
  programmeReportHrefForEnrollment,
  programmeReportShowsClassroomLink,
} from '../lib/learning/course-report-access.ts'
import {
  planReportCurriculumFallback,
  selectPublishedReportLessons,
} from '../lib/learning/course-report-curriculum.ts'
import {
  decideReportPublication,
  editorialProfileFromRow,
  emptyEditorialReportProfile,
  reportProfilePatch,
  studentVisibleEditorialProfile,
} from '../lib/learning/course-report-publication.ts'

const courseId = 'course-1'
const studentId = 'student-1'

function enrollment(overrides: Record<string, unknown> = {}) {
  return {
    user_id: studentId,
    status: 'admitted',
    course_id: courseId,
    access_starts_at: '2020-01-01T00:00:00.000Z',
    access_ends_at: '2099-01-01T00:00:00.000Z',
    ...overrides,
  }
}

test('admitted student with active access can read the report', () => {
  const decision = decideProgrammeReportAccess(enrollment(), studentId, courseId)
  assert.equal(decision.allowed, true)
  if (decision.allowed) assert.equal(decision.hideLiveAccess, false)
})

test('admitted student whose access starts in the future can still read the report', () => {
  const decision = decideProgrammeReportAccess(
    enrollment({ access_starts_at: '2099-01-01T00:00:00.000Z', access_ends_at: '2099-06-01T00:00:00.000Z' }),
    studentId,
    courseId
  )
  assert.equal(decision.allowed, true)
  if (decision.allowed) assert.equal(decision.hideLiveAccess, false)
})

test('payment pending and other non-admitted statuses are refused', () => {
  for (const status of ['payment_pending_review', 'applied', 'payment_rejected', 'cancelled', 'waitlisted']) {
    const decision = decideProgrammeReportAccess(enrollment({ status }), studentId, courseId)
    assert.equal(decision.allowed, false, status)
  }
})

test('a student without an enrollment is refused', () => {
  assert.equal(decideProgrammeReportAccess(null, studentId, courseId).allowed, false)
})

test('a student cannot read another enrollment', () => {
  const decision = decideProgrammeReportAccess(enrollment({ user_id: 'student-2' }), studentId, courseId)
  assert.equal(decision.allowed, false)
})

test('an unauthenticated request is refused', () => {
  assert.equal(decideProgrammeReportAccess(enrollment(), null, courseId).allowed, false)
})

test('draft lesson titles never survive the curriculum fallback', () => {
  const moduleMissing = planReportCurriculumFallback(
    'column course_content.module_id does not exist'
  )
  assert.equal(moduleMissing, 'retry-without-module')

  const rows = [
    { id: 'draft-1', title: 'Secret draft title', visibility: 'draft' },
    { id: 'pub-1', title: 'Published introduction', visibility: 'published' },
  ]
  const titles = selectPublishedReportLessons(rows).map((row) => row.title)
  assert.deepEqual(titles, ['Published introduction'])
  assert.equal(titles.includes('Secret draft title'), false)

  assert.equal(
    planReportCurriculumFallback("Could not find the 'visibility' column of 'course_content' in the schema cache"),
    'empty'
  )
  assert.equal(
    planReportCurriculumFallback('column course_content.visibility does not exist'),
    'empty'
  )
  assert.deepEqual(
    selectPublishedReportLessons([
      { id: 'draft-1', title: 'Secret draft title' },
      { id: 'pub-1', title: 'Published introduction' },
    ]),
    []
  )
})

test('published lesson titles stay available when only module_id is missing', () => {
  assert.equal(
    planReportCurriculumFallback("Could not find the 'module_id' column of 'course_content' in the schema cache"),
    'retry-without-module'
  )
  const published = selectPublishedReportLessons([
    { id: 'legacy-1', title: 'Legacy lesson', visibility: null },
    { id: 'pub-1', title: 'Published introduction', visibility: 'published' },
    { id: 'draft-1', title: 'Secret draft title', visibility: 'draft' },
  ])
  assert.deepEqual(
    published.map((row) => row.title),
    ['Legacy lesson', 'Published introduction']
  )
})

test('email-linked enrollments do not get a programme report link unless user_id matches', () => {
  assert.equal(programmeReportHrefForEnrollment(null, studentId, courseId), null)
  assert.equal(programmeReportHrefForEnrollment('student-2', studentId, courseId), null)
  assert.equal(programmeReportHrefForEnrollment('', studentId, courseId), null)
  assert.equal(
    programmeReportHrefForEnrollment(studentId, studentId, courseId),
    `/student/courses/${courseId}/report`
  )
})

test('a future-start admitted student keeps the report and does not get a classroom button', () => {
  const decision = decideProgrammeReportAccess(
    enrollment({
      access_starts_at: '2099-01-01T00:00:00.000Z',
      access_ends_at: '2099-06-01T00:00:00.000Z',
    }),
    studentId,
    courseId
  )
  assert.equal(decision.allowed, true)
  if (decision.allowed) assert.equal(decision.hideLiveAccess, false)
  assert.equal(programmeReportShowsClassroomLink('upcoming'), false)
  assert.equal(programmeReportShowsClassroomLink('active'), true)
  assert.equal(programmeReportShowsClassroomLink('expired'), true)
})

test('expired admitted access keeps the report but hides live session details', () => {
  const decision = decideProgrammeReportAccess(
    enrollment({
      access_starts_at: '2020-01-01T00:00:00.000Z',
      access_ends_at: '2020-02-01T00:00:00.000Z',
    }),
    studentId,
    courseId
  )
  assert.equal(decision.allowed, true)
  if (decision.allowed) assert.equal(decision.hideLiveAccess, true)
})

function publishedProfile() {
  return {
    ...emptyEditorialReportProfile(),
    overview: 'Overview',
    purpose: 'Purpose',
    learningObjectives: 'Objectives',
    learningOutcomes: 'Outcomes',
  }
}

test('a draft profile is hidden from students and a published profile is visible', () => {
  const row = {
    publication_status: 'draft',
    overview: 'Secret draft overview',
    purpose: 'Purpose',
    learning_objectives: 'Objectives',
    learning_outcomes: 'Outcomes',
  }
  assert.equal(studentVisibleEditorialProfile(row), null)
  assert.equal(studentVisibleEditorialProfile({ ...row, publication_status: 'published' })?.overview, 'Secret draft overview')
  assert.equal(studentVisibleEditorialProfile({ ...row, publication_status: 'archived' }), null)
})

test('publishing requires the minimum fields and unpublishing does not', () => {
  const incomplete = decideReportPublication(emptyEditorialReportProfile(), 'published')
  assert.equal(incomplete.ok, false)
  if (!incomplete.ok) {
    assert.deepEqual(incomplete.missing, [
      'Programme overview',
      'Programme purpose',
      'Learning objectives',
      'Learning outcomes',
    ])
  }
  const published = decideReportPublication(publishedProfile(), 'published')
  assert.deepEqual(published, { ok: true, status: 'published' })
  const unpublished = decideReportPublication(publishedProfile(), 'draft')
  assert.deepEqual(unpublished, { ok: true, status: 'draft' })
})

test('a partial save cannot clear omitted fields', () => {
  const partial = reportProfilePatch({ overview: 'Only overview' })
  assert.equal(partial.ok, false)
  const full = reportProfilePatch({
    ...publishedProfile(),
    overview: '',
    targetAudience: 'Graduates',
  })
  assert.equal(full.ok, true)
  if (full.ok) {
    assert.equal(full.patch.overview, null)
    assert.equal(full.patch.target_audience, 'Graduates')
    assert.equal(Object.prototype.hasOwnProperty.call(full.patch, 'publication_status'), false)
  }
})

test('stored editorial copy round-trips without dropping a supplied field', () => {
  const row = {
    overview: 'Overview',
    purpose: 'Purpose',
    target_audience: 'Graduates',
    entry_requirements: null,
    learning_objectives: 'Objectives',
    learning_outcomes: 'Outcomes',
    delivery_method: '',
    workload_description: null,
    assessment_description: null,
    certification_description: null,
    additional_information: 'Bring a notebook',
    publication_status: 'published',
  }
  const profile = editorialProfileFromRow(row)
  assert.equal(profile.targetAudience, 'Graduates')
  assert.equal(profile.additionalInformation, 'Bring a notebook')
  assert.equal(profile.deliveryMethod, null)
})
