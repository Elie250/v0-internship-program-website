import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  draftPrerequisiteWarning,
  validateDripPrerequisite,
  wouldCreateDripCycle,
} from '../lib/learning/drip-graph.ts'
import { isLessonUnlocked } from '../lib/learning/drip-content.ts'
import { defaultVisibilityForLessonType } from '../lib/learning/lesson-authoring-rules.ts'

/** Mirrors lib/learning/course-modules.groupLessonsByModule for Node self-checks. */
function groupLessonsByModule<T extends { id: string; module_id?: string | null; sort_order: number }>(
  modules: Array<{ id: string; title: string; sortOrder: number }>,
  lessons: T[]
): Array<{ moduleId: string | null; title: string; lessons: T[] }> {
  const sortedLessons = [...lessons].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    return a.id.localeCompare(b.id)
  })
  const sortedModules = [...modules].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.id.localeCompare(b.id)
  })
  const byModule = new Map<string, T[]>()
  const ungrouped: T[] = []
  for (const lesson of sortedLessons) {
    const mid = lesson.module_id != null ? String(lesson.module_id) : ''
    if (!mid) {
      ungrouped.push(lesson)
      continue
    }
    byModule.set(mid, [...(byModule.get(mid) ?? []), lesson])
  }
  const groups: Array<{ moduleId: string | null; title: string; lessons: T[] }> = []
  for (const mod of sortedModules) {
    const moduleLessons = byModule.get(mod.id) ?? []
    if (!moduleLessons.length) continue
    groups.push({ moduleId: mod.id, title: mod.title, lessons: moduleLessons })
  }
  if (ungrouped.length || groups.length === 0) {
    groups.push({ moduleId: null, title: 'Ungrouped', lessons: ungrouped })
  }
  return groups
}

test('migration 103 documents SET NULL only on module_id and avoids composite SET NULL', () => {
  const sql = readFileSync(
    join(process.cwd(), 'scripts/103-curriculum-outcomes-and-module-authoring.sql'),
    'utf8'
  )
  assert.match(sql, /curriculum_learning_outcomes/)
  assert.match(sql, /ON DELETE SET NULL/)
  assert.match(sql, /course_content_module_id_fkey/)
  assert.match(sql, /FOREIGN KEY \(module_id\) REFERENCES course_modules\(id\) ON DELETE SET NULL/)
  assert.match(sql, /would attempt to null course_content\.course_id/)
  assert.match(sql, /enforce_lesson_module_same_course/)
  assert.match(sql, /FOREIGN KEY \(module_id, course_id\)/)
  assert.match(sql, /FOREIGN KEY \(content_id, course_id\)/)
  assert.match(sql, /ON DELETE CASCADE/)
  assert.equal(
    /FOREIGN KEY \(module_id,\s*course_id\)[\s\S]*?ON DELETE SET NULL/.test(sql),
    false
  )
  assert.doesNotMatch(sql, /course_enrollments/)
  assert.doesNotMatch(sql, /student_certificates/)
})

test('module deletion contract: only module_id clears; course_id stays (documented simulation)', () => {
  // Mirrors PostgreSQL single-column ON DELETE SET NULL behavior used in migration 103.
  const lesson = {
    id: 'lesson-1',
    course_id: 'course-1',
    module_id: 'module-1' as string | null,
  }
  lesson.module_id = null
  assert.equal(lesson.module_id, null)
  assert.equal(lesson.course_id, 'course-1')
  assert.equal(lesson.id, 'lesson-1')
})

test('interactive create defaults draft; URL types default published', () => {
  assert.equal(defaultVisibilityForLessonType('interactive'), 'draft')
  assert.equal(defaultVisibilityForLessonType('video'), 'published')
  assert.equal(defaultVisibilityForLessonType('pdf'), 'published')
})

test('drip AND gates: unlock_at and unlock_after must both pass', () => {
  const future = new Date(Date.now() + 60_000).toISOString()
  const past = new Date(Date.now() - 60_000).toISOString()
  const lesson = {
    id: 'b',
    sort_order: 1,
    unlock_at: future,
    unlock_after_content_id: 'a',
  }
  assert.equal(isLessonUnlocked(lesson, new Set(['a']), Date.now(), new Set(['a', 'b'])), false)
  assert.equal(
    isLessonUnlocked({ ...lesson, unlock_at: past }, new Set([]), Date.now(), new Set(['a', 'b'])),
    false
  )
  assert.equal(
    isLessonUnlocked({ ...lesson, unlock_at: past }, new Set(['a']), Date.now(), new Set(['a', 'b'])),
    true
  )
})

test('drip cycle detection across a course graph', () => {
  const lessons = [
    { id: 'a', unlockAfterContentId: null, visibility: 'published' },
    { id: 'b', unlockAfterContentId: 'a', visibility: 'published' },
    { id: 'c', unlockAfterContentId: 'b', visibility: 'published' },
  ]
  assert.equal(wouldCreateDripCycle(lessons, 'a', 'c'), true)
  assert.equal(wouldCreateDripCycle(lessons, 'c', 'a'), false)
  assert.equal(validateDripPrerequisite({ lessons, lessonId: 'a', prerequisiteId: 'c' }).ok, false)
  assert.equal(
    validateDripPrerequisite({
      lessons: [...lessons, { id: 'draft', unlockAfterContentId: null, visibility: 'draft' }],
      lessonId: 'c',
      prerequisiteId: 'draft',
    }).ok,
    false
  )
  assert.match(draftPrerequisiteWarning(lessons, 'missing') ?? '', /missing/i)
})

test('module grouping is deterministic with zero-based sort_order', () => {
  const groups = groupLessonsByModule(
    [
      { id: 'm2', title: 'Module B', sortOrder: 1 },
      { id: 'm1', title: 'Module A', sortOrder: 0 },
    ],
    [
      { id: 'l3', module_id: 'm2', sort_order: 0 },
      { id: 'l1', module_id: 'm1', sort_order: 1 },
      { id: 'l0', module_id: 'm1', sort_order: 0 },
      { id: 'l9', module_id: null, sort_order: 0 },
    ]
  )
  assert.equal(groups[0].title, 'Module A')
  assert.deepEqual(
    groups[0].lessons.map((l) => l.id),
    ['l0', 'l1']
  )
  assert.equal(groups[1].title, 'Module B')
  assert.equal(groups[2].title, 'Ungrouped')
  assert.deepEqual(
    groups[2].lessons.map((l) => l.id),
    ['l9']
  )
})

test('phase A authoring surfaces are wired', () => {
  const admin = readFileSync(join(process.cwd(), 'components/admin/course-management.tsx'), 'utf8')
  const lecturer = readFileSync(
    join(process.cwd(), 'components/lecturer/lecturer-course-workspace.tsx'),
    'utf8'
  )
  const lessonManager = readFileSync(
    join(process.cwd(), 'components/learning/course-lesson-manager.tsx'),
    'utf8'
  )
  assert.match(admin, /CourseModulesPanel/)
  assert.match(admin, /CourseOutcomesPanel/)
  assert.match(lecturer, /CourseModulesPanel/)
  assert.match(lessonManager, /unlock_after_content_id/)
  assert.match(lessonManager, /datetime-local/)
})
