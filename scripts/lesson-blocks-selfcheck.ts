/**
 * Phase 1–2 interactive-lesson contracts (no network).
 * Run: pnpm test:lesson-blocks
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  canPublishAuthoredLesson,
  defaultVisibilityForLessonType,
  lessonTypeRequiresUrl,
} from '../lib/learning/lesson-authoring-rules.ts'
import {
  createEmptyLessonBlock,
  inspectLessonResourceUrl,
  isPreferredLessonAssetHost,
  moveLessonBlock,
  parseLessonBody,
  removeLessonBlock,
  validateLessonBodyForSave,
} from '../lib/learning/lesson-blocks.ts'
import {
  effectiveUnlockAfterContentId,
  filterUnlockedLessons,
  isLessonUnlocked,
} from '../lib/learning/drip-content.ts'
import {
  EMPTY_LESSON_EDITOR_SNAPSHOT,
  isLessonEditorDirty,
  resolveUnsavedNavigation,
  shouldPromptUnsavedNavigation,
  snapshotAfterSuccessfulSave,
} from '../lib/learning/lesson-editor-guard.ts'
import {
  completionFromPublishedLessons,
  filterPublishedLessonRows,
  isPublishedLessonVisibility,
  publishedLessonIdsFromRows,
  requirePublishedLessonIds,
} from '../lib/learning/lesson-visibility.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const readSrc = (relative: string) => readFileSync(join(root, relative), 'utf8')

function canMarkLessonComplete(input: {
  contentType: string
  timeSpentSeconds: number
  watchPercent: number
}) {
  if (input.timeSpentSeconds < 45) return false
  if (input.contentType === 'video' && input.watchPercent < 80) return false
  return true
}

describe('parseLessonBody', () => {
  it('returns empty for URL-only lessons', () => {
    assert.deepEqual(parseLessonBody([]), [])
    assert.deepEqual(parseLessonBody(null), [])
    assert.deepEqual(parseLessonBody(undefined), [])
  })

  it('keeps valid Phase 1 blocks', () => {
    const blocks = parseLessonBody([
      { type: 'heading', text: 'Ladder logic', level: 2 },
      { type: 'rich_text', text: 'A coil is an output.' },
      { type: 'callout', tone: 'tip', text: 'Start with one rung.' },
      { type: 'code', language: 'iecst', code: 'IF I0.0 THEN Q0.0 := TRUE; END_IF;' },
      {
        type: 'image',
        url: 'https://media.energyandlogics.com/lessons/rung.png',
        caption: 'Single rung',
      },
      {
        type: 'resource',
        content_type: 'pdf',
        url: 'https://media.energyandlogics.com/notes.pdf',
      },
    ])
    assert.equal(blocks.length, 6)
    assert.equal(blocks[0]?.type, 'heading')
    assert.equal(blocks[3]?.type, 'code')
  })

  it('drops unknown, invalid, and unsafe blocks', () => {
    const blocks = parseLessonBody([
      { type: 'self_check', question: 'not in phase 1' },
      { type: 'rich_text', text: '' },
      { type: 'image', url: 'javascript:alert(1)' },
      { type: 'image', url: 'http://example.com/legacy.png' },
      { type: 'image', url: 'https://example.com/diagram.svg' },
      { type: 'resource', content_type: 'pdf', url: '/relative.pdf' },
      { type: 'heading', text: 'Kept' },
    ])
    assert.equal(blocks.length, 1)
    assert.equal(blocks[0]?.type, 'heading')
  })

  it('parses JSON strings and caps block count', () => {
    const blocks = parseLessonBody(JSON.stringify([{ type: 'heading', text: 'From JSON' }]))
    assert.equal(blocks[0]?.type, 'heading')
    const many = Array.from({ length: 90 }, (_, i) => ({ type: 'heading', text: `H${i}` }))
    assert.equal(parseLessonBody(many).length, 80)
  })
})

describe('draft visibility', () => {
  it('treats missing visibility as published', () => {
    assert.equal(isPublishedLessonVisibility(null), true)
    assert.equal(isPublishedLessonVisibility(undefined), true)
    assert.equal(isPublishedLessonVisibility(''), true)
    assert.equal(isPublishedLessonVisibility('published'), true)
    assert.equal(isPublishedLessonVisibility('draft'), false)
  })

  it('hides drafts from the student list', () => {
    const visible = filterPublishedLessonRows([
      { id: 'a', visibility: 'published' },
      { id: 'b', visibility: 'draft' },
      { id: 'c' },
    ])
    assert.deepEqual(
      visible.map((row) => row.id),
      ['a', 'c']
    )
  })
})

describe('published lesson counts', () => {
  const rows = [
    { id: 'pub-1', visibility: 'published' },
    { id: 'draft-1', visibility: 'draft' },
    { id: 'legacy-1' },
  ]

  it('counts published and legacy rows, excludes drafts', () => {
    assert.deepEqual(publishedLessonIdsFromRows(rows), ['pub-1', 'legacy-1'])
  })

  it('uses the same published set for completion and report lessonCount', () => {
    const publishedIds = publishedLessonIdsFromRows(rows)
    assert.equal(publishedIds.length, 2)

    const allDone = completionFromPublishedLessons(publishedIds, ['pub-1', 'legacy-1', 'draft-1'])
    assert.deepEqual(allDone, { complete: true, total: 2, completed: 2 })

    const oneDone = completionFromPublishedLessons(publishedIds, ['pub-1', 'draft-1'])
    assert.deepEqual(oneDone, { complete: false, total: 2, completed: 1 })
  })

  it('keeps empty published lists as complete (existing no-lesson contract)', () => {
    assert.deepEqual(completionFromPublishedLessons([], ['draft-1']), {
      complete: true,
      total: 0,
      completed: 0,
    })
  })

  it('never substitutes an unfiltered id list when the visibility query fails', () => {
    assert.throws(
      () => requirePublishedLessonIds({ error: 'schema cache' }),
      /schema cache/
    )
    assert.deepEqual(requirePublishedLessonIds({ ids: ['pub-1'] }), ['pub-1'])
  })
})

describe('progress gates (existing + interactive)', () => {
  it('keeps the video 80% watch rule', () => {
    assert.equal(
      canMarkLessonComplete({ contentType: 'video', timeSpentSeconds: 45, watchPercent: 79 }),
      false
    )
    assert.equal(
      canMarkLessonComplete({ contentType: 'video', timeSpentSeconds: 45, watchPercent: 80 }),
      true
    )
  })

  it('lets PDF and interactive complete after 45s without watch percent', () => {
    assert.equal(
      canMarkLessonComplete({ contentType: 'pdf', timeSpentSeconds: 44, watchPercent: 0 }),
      false
    )
    assert.equal(
      canMarkLessonComplete({ contentType: 'pdf', timeSpentSeconds: 45, watchPercent: 0 }),
      true
    )
    assert.equal(
      canMarkLessonComplete({ contentType: 'interactive', timeSpentSeconds: 45, watchPercent: 0 }),
      true
    )
  })
})

describe('authoring URL rules', () => {
  it('accepts HTTPS lesson assets and prefers the R2 media host', () => {
    assert.equal(
      inspectLessonResourceUrl('https://media.energyandlogics.com/lessons/rung.png', {
        kind: 'media',
      }).ok,
      true
    )
    assert.equal(isPreferredLessonAssetHost('https://media.energyandlogics.com/lessons/rung.png'), true)
    assert.equal(inspectLessonResourceUrl('https://www.youtube.com/watch?v=abc', { kind: 'resource' }).ok, true)
  })

  it('rejects unsafe schemes, relative URLs, HTTP, and SVG images', () => {
    assert.equal(inspectLessonResourceUrl('javascript:alert(1)', { kind: 'media' }).ok, false)
    assert.equal(inspectLessonResourceUrl('data:image/png;base64,xx', { kind: 'media' }).ok, false)
    assert.equal(inspectLessonResourceUrl('/notes.pdf', { kind: 'resource' }).ok, false)
    assert.equal(inspectLessonResourceUrl('http://example.com/a.png', { kind: 'media' }).ok, false)
    assert.equal(inspectLessonResourceUrl('https://cdn.example.com/a.svg', { kind: 'media' }).ok, false)
    assert.equal(
      inspectLessonResourceUrl('https://cdn.example.com/a.png?format=svg', { kind: 'media' }).ok,
      false
    )
  })
})

describe('interactive lesson authoring', () => {
  const validBlocks = [
    { type: 'heading', text: 'Inputs' },
    { type: 'rich_text', text: 'A contact reads an input.' },
  ]

  it('creates an interactive lesson without a URL as a draft', () => {
    const body = validateLessonBodyForSave(validBlocks)
    assert.equal(body.ok, true)
    if (!body.ok) return
    assert.equal(lessonTypeRequiresUrl('interactive'), false)
    assert.equal(defaultVisibilityForLessonType('interactive'), 'draft')
    assert.equal(body.blocks.length, 2)
  })

  it('keeps existing URL lessons published and URL-required', () => {
    assert.equal(lessonTypeRequiresUrl('video'), true)
    assert.equal(defaultVisibilityForLessonType('video'), 'published')
    const emptyBody = validateLessonBodyForSave([])
    assert.equal(emptyBody.ok, true)
    if (!emptyBody.ok) return
    assert.equal(emptyBody.blocks.length, 0)
  })

  it('edits, adds, deletes, and reorders blocks before persist', () => {
    const heading = createEmptyLessonBlock('heading')
    heading.text = 'First'
    const explanation = createEmptyLessonBlock('rich_text')
    explanation.text = 'Second'
    const code = createEmptyLessonBlock('code')
    code.code = 'Q0.0 := TRUE;'

    const added = [heading, explanation, code]
    const reordered = moveLessonBlock(added, 2, -1)
    assert.equal(reordered[1]?.type, 'code')
    const deleted = removeLessonBlock(reordered, 0)
    assert.equal(deleted.length, 2)
    assert.equal(deleted[0]?.type, 'code')

    const saved = validateLessonBodyForSave(deleted)
    assert.equal(saved.ok, true)
    if (!saved.ok) return
    assert.deepEqual(
      saved.blocks.map((block) => block.type),
      ['code', 'rich_text']
    )
  })

  it('rejects invalid blocks and unsafe URLs on save', () => {
    const invalid = validateLessonBodyForSave([{ type: 'heading', text: '' }])
    assert.equal(invalid.ok, false)

    const unsafe = validateLessonBodyForSave([
      { type: 'image', url: 'javascript:alert(1)' },
    ])
    assert.equal(unsafe.ok, false)

    const svg = validateLessonBodyForSave([
      { type: 'diagram', url: 'https://media.energyandlogics.com/ladder.svg' },
    ])
    assert.equal(svg.ok, false)
  })

  it('requires valid content before publishing interactive lessons', () => {
    assert.equal(
      canPublishAuthoredLesson({
        title: 'Empty interactive',
        contentType: 'interactive',
        blockCount: 0,
      }).ok,
      false
    )
    assert.equal(
      canPublishAuthoredLesson({
        title: 'Ready interactive',
        contentType: 'interactive',
        blockCount: 2,
      }).ok,
      true
    )
    assert.equal(
      canPublishAuthoredLesson({
        title: 'Week 1 video',
        contentType: 'video',
        contentUrl: 'https://www.youtube.com/watch?v=abc',
        blockCount: 0,
      }).ok,
      true
    )
  })
})

describe('draft visibility and student progress', () => {
  it('keeps drafts out of student lists and completion totals', () => {
    const rows = [
      { id: 'pub', visibility: 'published' },
      { id: 'draft', visibility: 'draft' },
    ]
    assert.deepEqual(filterPublishedLessonRows(rows).map((row) => row.id), ['pub'])
    assert.deepEqual(completionFromPublishedLessons(['pub'], ['pub', 'draft']), {
      complete: true,
      total: 1,
      completed: 1,
    })
  })
})

describe('draft drip prerequisites', () => {
  const later = {
    id: 'later',
    sort_order: 2,
    unlock_after_content_id: 'draft-prereq',
  }

  it('does not permanently lock a published lesson behind a draft prerequisite', () => {
    const published = new Set(['later'])
    assert.equal(effectiveUnlockAfterContentId('draft-prereq', published), null)
    assert.equal(isLessonUnlocked(later, new Set(), Date.now(), published), true)
    assert.deepEqual(
      filterUnlockedLessons([later], new Set(), Date.now(), published).map((lesson) => lesson.id),
      ['later']
    )
  })

  it('still requires a published prerequisite to be completed', () => {
    const published = new Set(['prereq', 'later'])
    const gated = { ...later, unlock_after_content_id: 'prereq' }
    assert.equal(isLessonUnlocked(gated, new Set(), Date.now(), published), false)
    assert.equal(isLessonUnlocked(gated, new Set(['prereq']), Date.now(), published), true)
  })
})

describe('authorization and workflow contracts', () => {
  it('lesson PATCH stays behind existing lecturer and admin authorization', () => {
    const lecturer = readSrc('app/api/lecturer/course-content/[id]/route.ts')
    const admin = readSrc('app/api/admin/course-content/[id]/route.ts')
    assert.match(lecturer, /export async function PATCH/)
    assert.match(lecturer, /requireLecturerCourseAccess/)
    assert.match(admin, /export async function PATCH/)
    assert.match(admin, /requireAdminPermission/)
    assert.match(admin, /LEARNING_PROGRAMS/)
  })

  it('does not change course creation or approval', () => {
    const createCourse = readSrc('app/api/lecturer/courses/route.ts')
    assert.match(createCourse, /status:\s*'pending_review'/)
    assert.doesNotMatch(createCourse, /updateCourseLesson/)
    const mutations = readSrc('lib/learning/course-content-mutations.ts')
    assert.doesNotMatch(mutations, /from\('courses'\)\.update/)
    assert.match(mutations, /normalizeLessonAuthoringInput/)
    assert.match(mutations, /validateLessonForPublish/)
  })
})

describe('unsaved lesson navigation', () => {
  const edited = {
    title: 'Ladder basics',
    content_type: 'interactive',
    content_url: '',
    blocks: [{ type: 'heading', text: 'Inputs' }],
  }

  it('detects dirty transitions and clears them after a successful save', () => {
    assert.equal(isLessonEditorDirty(edited, EMPTY_LESSON_EDITOR_SNAPSHOT), true)
    assert.equal(isLessonEditorDirty(edited, edited), false)
    assert.equal(isLessonEditorDirty(snapshotAfterSuccessfulSave(edited), edited), false)
    assert.equal(
      isLessonEditorDirty(
        { ...edited, title: 'Ladder basics edited' },
        snapshotAfterSuccessfulSave(edited)
      ),
      true
    )
  })

  it('prompts only while changes are pending', () => {
    assert.equal(shouldPromptUnsavedNavigation(true), true)
    assert.equal(shouldPromptUnsavedNavigation(false), false)
  })

  it('lets the user save, discard, or remain', () => {
    assert.deepEqual(resolveUnsavedNavigation('stay'), {
      allow: false,
      persist: false,
      discard: false,
    })
    assert.deepEqual(resolveUnsavedNavigation('discard'), {
      allow: true,
      persist: false,
      discard: true,
    })
    assert.deepEqual(resolveUnsavedNavigation('save'), {
      allow: true,
      persist: true,
      discard: false,
    })
  })

  it('wires one dirty source into lecturer tabs and admin close paths', () => {
    const manager = readSrc('components/learning/course-lesson-manager.tsx')
    const lecturer = readSrc('components/lecturer/lecturer-course-workspace.tsx')
    const admin = readSrc('components/admin/course-management.tsx')
    assert.match(manager, /isLessonEditorDirty/)
    assert.match(manager, /beforeunload/)
    assert.match(manager, /registerLeaveHandler/)
    assert.match(lecturer, /LessonEditorGuardProvider/)
    assert.match(lecturer, /handleTabChange/)
    assert.match(lecturer, /requestLeave/)
    assert.match(admin, /LessonEditorGuardProvider/)
    assert.match(admin, /requestLeave/)
  })
})

