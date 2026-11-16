import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

test('migration 101 adds workload columns and learning-plan tables', () => {
  const sql = readFileSync(
    join(process.cwd(), 'scripts/101-curriculum-workload-and-learning-plans.sql'),
    'utf8'
  )
  assert.match(sql, /estimated_minutes/)
  assert.match(sql, /activity_kind/)
  assert.match(sql, /course_learning_plan_templates/)
  assert.match(sql, /course_learning_plan_days/)
  assert.match(sql, /course_learning_plan_items/)
  assert.match(sql, /snapshot_minutes/)
  assert.match(sql, /snapshot_activity_kind/)
  assert.match(sql, /portion_minutes/)
  assert.match(sql, /span_group_id/)
  assert.match(sql, /USING \(false\)/)
  assert.doesNotMatch(sql, /DROP TABLE/i)
  assert.doesNotMatch(sql, /course_enrollments/)
})

test('migration 102 adds title snapshots, revision uniqueness, and transactional publish/clone', () => {
  const sql = readFileSync(
    join(process.cwd(), 'scripts/102-learning-plan-publish-integrity.sql'),
    'utf8'
  )
  assert.match(sql, /snapshot_title/)
  assert.match(sql, /course_learning_plan_templates_course_revision_uidx/)
  assert.match(sql, /publish_course_learning_plan/)
  assert.match(sql, /clone_published_learning_plan_to_draft/)
  assert.match(sql, /app\.learning_plan_write/)
  assert.match(sql, /FOR UPDATE/)
  assert.match(sql, /Published and archived learning plans cannot be modified/)
  assert.match(sql, /SECURITY DEFINER/)
  assert.doesNotMatch(sql, /DROP TABLE/i)
})

test('publish path freezes titles and requires activity kind', () => {
  const src = readFileSync(join(process.cwd(), 'lib/learning/learning-plan-template.ts'), 'utf8')
  assert.match(src, /snapshot_title/)
  assert.match(src, /snapshotTitle/)
  assert.match(src, /publish_course_learning_plan/)
  assert.match(src, /clone_published_learning_plan_to_draft/)
  assert.match(src, /missing_kind/)
  assert.match(src, /isHistoricalStatus/)
  assert.match(src, /historical \? snapshotTitle/)
  assert.match(src, /Set an activity kind/)
  assert.match(src, /Published revisions cannot be edited in place/)
})

test('admin learning-plan panel documents flexible policy and clone-from-published', () => {
  const src = readFileSync(
    join(process.cwd(), 'components/admin/course-learning-plan-panel.tsx'),
    'utf8'
  )
  assert.match(src, /not attendance/i)
  assert.match(src, /certificates/i)
  assert.match(src, /Publish revision/)
  assert.match(src, /Save draft/)
  assert.match(src, /Workshops stay/)
  assert.match(src, /Edit as new draft/)
  assert.match(src, /clone_to_draft/)
})

test('phase 1 does not generate enrollment schedules in admit path', () => {
  const admit = readFileSync(join(process.cwd(), 'lib/enrollment/admit.ts'), 'utf8')
  assert.doesNotMatch(admit, /learning_plan/)
  assert.doesNotMatch(admit, /enrollment_learning_schedule/)
})
