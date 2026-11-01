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
  MAX_BLOCK_TEXT,
  moveLessonBlock,
  parseLessonBody,
  previewLessonBlocks,
  projectLessonBlocksForStudent,
  removeLessonBlock,
  validateLessonBodyForSave,
} from '../lib/learning/lesson-blocks.ts'
import {
  canCompleteCheckpointedLesson,
  gradeCheckpointChoice,
  nextCheckpointProgress,
  visibleLessonBlocks,
} from '../lib/learning/lesson-checkpoints.ts'
import {
  embedMediaUrl,
  parseYouTubeVideoId,
  youtubePrivacyEmbedUrl,
} from '../lib/learning/media-embed.ts'
import {
  isSafeLessonHref,
  prepareRichTextFields,
  sanitizeLessonHtml,
} from '../lib/learning/lesson-html.ts'
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

describe('rich text sanitization', () => {
  const formattedHtml = [
    '<h2 style="text-align:center">Inputs</h2>',
    '<p>A <strong>coil</strong> is <em>an</em> <u>output</u>.</p>',
    '<ol><li>First<sub>1</sub></li><li>Second<sup>2</sup><ul><li>Nested</li></ul></li></ol>',
    '<p><a href="https://energyandlogics.com/notes">Notes</a></p>',
  ].join('')

  it('keeps existing plaintext lessons without inventing HTML', () => {
    const parsed = parseLessonBody([{ type: 'rich_text', text: 'A coil is an output.\n\nSecond paragraph.' }])
    assert.equal(parsed.length, 1)
    assert.equal(parsed[0]?.type, 'rich_text')
    if (parsed[0]?.type !== 'rich_text') return
    assert.equal(parsed[0].text, 'A coil is an output.\n\nSecond paragraph.')
    assert.equal(parsed[0].html, undefined)
  })

  it('preserves supported formatting and HTTPS links', () => {
    const sanitized = sanitizeLessonHtml(formattedHtml)
    assert.match(sanitized.html, /<h2 style="text-align:center">Inputs<\/h2>/)
    assert.match(sanitized.html, /<strong>coil<\/strong>/)
    assert.match(sanitized.html, /<em>an<\/em>/)
    assert.match(sanitized.html, /<u>output<\/u>/)
    assert.match(sanitized.html, /<ol>/)
    assert.match(sanitized.html, /<ul><li>Nested<\/li><\/ul>/)
    assert.match(sanitized.html, /<sub>1<\/sub>/)
    assert.match(sanitized.html, /<sup>2<\/sup>/)
    assert.match(sanitized.html, /href="https:\/\/energyandlogics.com\/notes"/)
    assert.match(sanitized.html, /rel="noopener noreferrer"/)
    assert.match(sanitized.text, /Inputs/)
    assert.match(sanitized.text, /coil/)
  })

  it('removes Word-specific markup and converts Word lists', () => {
    const wordHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office">
        <head><style>p.MsoNormal { mso-style-name: normal; }</style><xml><o:ignored /></xml></head>
        <body>
          <!--[if gte mso 9]><xml><o:OfficeDocumentSettings></o:OfficeDocumentSettings></xml><![endif]-->
          <p class="MsoNormal" style="text-align:center;mso-para-margin:0"><b>Hello</b> <i>PLC</i></p>
          <p class="MsoListParagraph" style="mso-list:l0 level1 lfo1"><span>1.</span> First item</p>
          <p class="MsoListParagraph" style="mso-list:l0 level1 lfo1"><span>2.</span> Second item</p>
          <p class="MsoNormal">Done<o:p></o:p></p>
        </body>
      </html>
    `
    const sanitized = sanitizeLessonHtml(wordHtml)
    assert.doesNotMatch(sanitized.html, /mso-/i)
    assert.doesNotMatch(sanitized.html, /<style/i)
    assert.doesNotMatch(sanitized.html, /<xml/i)
    assert.doesNotMatch(sanitized.html, /MsoNormal/)
    assert.doesNotMatch(sanitized.html, /<!--/)
    assert.match(sanitized.html, /<strong>Hello<\/strong>/)
    assert.match(sanitized.html, /<em>PLC<\/em>/)
    assert.match(sanitized.html, /text-align:center/)
    assert.match(sanitized.html, /<(ol|ul)>/)
    assert.match(sanitized.html, /First item/)
    assert.equal(sanitizeLessonHtml(sanitized.html).html, sanitized.html)
  })

  it('strips scripts, event handlers, and javascript links', () => {
    const dirty = `
      <p onclick="alert(1)" onerror="alert(1)">Safe <script>alert(1)</script> text</p>
      <img src="x" onerror="alert(1)" />
      <a href="javascript:alert(1)">Bad</a>
      <a href="javascript&#58;alert(1)">Also bad</a>
      <a href="data:text/html,hi">Data</a>
      <a href="/relative">Relative</a>
      <a href="https://energyandlogics.com">Good</a>
    `
    const sanitized = sanitizeLessonHtml(dirty)
    assert.doesNotMatch(sanitized.html, /<script/i)
    assert.doesNotMatch(sanitized.html, /onerror/i)
    assert.doesNotMatch(sanitized.html, /onclick/i)
    assert.doesNotMatch(sanitized.html, /javascript/i)
    assert.doesNotMatch(sanitized.html, /data:/i)
    assert.doesNotMatch(sanitized.html, /href="\/relative"/)
    assert.match(sanitized.html, /https:\/\/energyandlogics.com/)
    assert.match(sanitized.html, /Safe/)
    assert.equal(isSafeLessonHref('javascript:alert(1)').ok, false)
    assert.equal(isSafeLessonHref('data:text/html,hi').ok, false)
    assert.equal(isSafeLessonHref('/notes').ok, false)
    assert.equal(isSafeLessonHref('https://energyandlogics.com').ok, true)
  })

  it('rejects oversized text and HTML', () => {
    const oversized = 'A'.repeat(MAX_BLOCK_TEXT + 1)
    assert.equal(prepareRichTextFields(oversized).ok, false)
    assert.equal(prepareRichTextFields('ok', oversized).ok, false)
    const saved = validateLessonBodyForSave([{ type: 'rich_text', text: oversized }])
    assert.equal(saved.ok, false)
    const savedHtml = validateLessonBodyForSave([
      { type: 'rich_text', text: 'ok', html: `<p>${oversized}</p>` },
    ])
    assert.equal(savedHtml.ok, false)
  })

  it('sanitizes on save so the student payload matches lecturer preview', () => {
    const dirtyBlock = {
      type: 'rich_text',
      id: 'blk_preview',
      text: 'Safe text',
      html: '<p>Safe <strong>text</strong><script>alert(1)</script></p>',
    }
    const preview = previewLessonBlocks([dirtyBlock])
    const student = parseLessonBody([dirtyBlock])
    const saved = validateLessonBodyForSave([dirtyBlock])
    assert.equal(saved.ok, true)
    if (!saved.ok) return
    assert.deepEqual(preview, student)
    assert.deepEqual(saved.blocks, student)
    assert.equal(student[0]?.type, 'rich_text')
    if (student[0]?.type !== 'rich_text') return
    assert.match(student[0].html || '', /<strong>text<\/strong>/)
    assert.doesNotMatch(student[0].html || '', /<script/i)
  })

  it('leaves URL-based lessons on an empty body', () => {
    const empty = validateLessonBodyForSave([])
    assert.equal(empty.ok, true)
    if (!empty.ok) return
    assert.deepEqual(empty.blocks, [])
    assert.deepEqual(parseLessonBody([]), [])
    assert.equal(lessonTypeRequiresUrl('video'), true)
    assert.equal(defaultVisibilityForLessonType('video'), 'published')
  })

  it('keeps the shared renderer on a sanitized HTML path and the plaintext fallback', () => {
    const renderer = readSrc('components/learning/lesson-block-renderer.tsx')
    assert.match(renderer, /sanitizeLessonHtml/)
    assert.match(renderer, /dangerouslySetInnerHTML/)
    assert.match(renderer, /whitespace-pre-wrap/)
    const editor = readSrc('components/learning/rich-text-block-editor.tsx')
    assert.match(editor, /contentEditable/)
    assert.match(editor, /sanitizeLessonHtml/)
    assert.doesNotMatch(editor, /tiptap|quill|slate-react|@tiptap/i)
    const pkg = readSrc('package.json')
    assert.doesNotMatch(pkg, /tiptap|quill|@tiptap|slate-react/)
  })
})

describe('youtube blocks', () => {
  const videoId = 'dQw4w9wgWcQ'
  const embed = `https://www.youtube-nocookie.com/embed/${videoId}`

  it('accepts standard, short, shorts, and embed YouTube URLs', () => {
    const accepted = [
      `https://www.youtube.com/watch?v=${videoId}`,
      `https://youtu.be/${videoId}`,
      `https://www.youtube.com/shorts/${videoId}`,
      `https://www.youtube.com/embed/${videoId}`,
      `https://m.youtube.com/watch?v=${videoId}`,
      `https://youtube.com/watch?v=${videoId}&t=12s`,
    ]
    for (const url of accepted) {
      const parsed = parseYouTubeVideoId(url)
      assert.equal(parsed.ok, true, url)
      if (!parsed.ok) continue
      assert.equal(parsed.videoId, videoId)
      assert.equal(youtubePrivacyEmbedUrl(parsed.videoId), embed)
      assert.equal(embedMediaUrl(url), embed)
    }
  })

  it('rejects http, other hosts, playlists, live chat, redirects, iframe HTML, and bad IDs', () => {
    const rejected = [
      `http://www.youtube.com/watch?v=${videoId}`,
      `https://vimeo.com/123456789`,
      'https://www.youtube.com/playlist?list=PLabcdefghij',
      `https://www.youtube.com/live_chat?v=${videoId}`,
      'https://www.youtube.com/redirect?q=https://evil.example',
      `<iframe src="https://www.youtube.com/embed/${videoId}"></iframe>`,
      'https://www.youtube.com/watch?v=short',
      'https://www.youtube.com/watch?v=../not-an-id',
      'https://music.youtube.com/watch?v=dQw4w9wgWcQ',
      'https://www.youtube-nocookie.com/embed/dQw4w9wgWcQ',
    ]
    for (const url of rejected) {
      assert.equal(parseYouTubeVideoId(url).ok, false, url)
      assert.equal(
        validateLessonBodyForSave([{ type: 'youtube', id: 'blk_bad', url, title: 'Clip' }]).ok,
        false,
        url
      )
    }
  })

  it('requires a title and keeps optional intro and caption', () => {
    const missingTitle = validateLessonBodyForSave([
      { type: 'youtube', id: 'blk_yt', url: `https://youtu.be/${videoId}`, title: '' },
    ])
    assert.equal(missingTitle.ok, false)

    const saved = validateLessonBodyForSave([
      {
        type: 'youtube',
        id: 'blk_yt',
        url: `https://youtu.be/${videoId}`,
        title: 'Motor starter walkthrough',
        intro: 'Watch this before the lab.',
        caption: 'Courtesy of Energy & Logics',
      },
    ])
    assert.equal(saved.ok, true)
    if (!saved.ok) return
    assert.equal(saved.blocks[0]?.type, 'youtube')
    if (saved.blocks[0]?.type !== 'youtube') return
    assert.equal(saved.blocks[0].title, 'Motor starter walkthrough')
    assert.equal(saved.blocks[0].intro, 'Watch this before the lab.')
    assert.equal(saved.blocks[0].caption, 'Courtesy of Energy & Logics')
    assert.equal(embedMediaUrl(saved.blocks[0].url), embed)
    assert.doesNotMatch(saved.blocks[0].url, /youtube-nocookie/)
  })

  it('keeps lecturer preview aligned with the student parse and drops invalid youtube blocks', () => {
    const block = {
      type: 'youtube',
      id: 'blk_preview_yt',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: 'Previewed clip',
    }
    const preview = previewLessonBlocks([block])
    const student = parseLessonBody([block])
    const saved = validateLessonBodyForSave([block])
    assert.equal(saved.ok, true)
    if (!saved.ok) return
    assert.deepEqual(preview, student)
    assert.deepEqual(saved.blocks, student)
    assert.equal(parseLessonBody([{ type: 'youtube', url: 'https://vimeo.com/1', title: 'No' }]).length, 0)
  })

  it('does not change old plaintext lessons or URL-based video lessons', () => {
    const plaintext = parseLessonBody([{ type: 'rich_text', text: 'A coil is an output.' }])
    assert.equal(plaintext[0]?.type, 'rich_text')
    if (plaintext[0]?.type === 'rich_text') {
      assert.equal(plaintext[0].html, undefined)
    }

    const empty = validateLessonBodyForSave([])
    assert.equal(empty.ok, true)
    if (empty.ok) assert.deepEqual(empty.blocks, [])
    assert.equal(lessonTypeRequiresUrl('video'), true)
    assert.equal(defaultVisibilityForLessonType('video'), 'published')
    assert.equal(embedMediaUrl(`https://www.youtube.com/watch?v=${videoId}`), embed)
    assert.equal(embedMediaUrl('https://vimeo.com/123456789'), 'https://player.vimeo.com/video/123456789')
  })

  it('renders derived nocookie iframes and does not trust client embed HTML', () => {
    const renderer = readSrc('components/learning/lesson-block-renderer.tsx')
    const editor = readSrc('components/learning/lesson-block-editor.tsx')
    assert.match(renderer, /youtubePrivacyEmbedUrl/)
    assert.match(renderer, /parseYouTubeVideoId/)
    assert.match(editor, /YouTube URL/)
    assert.doesNotMatch(renderer, /block\.embed/)
    const config = readSrc('next.config.mjs')
    assert.doesNotMatch(config, /Content-Security-Policy/)
  })
})

describe('checkpoint blocks', () => {
  const validCheckpoint = {
    type: 'checkpoint',
    id: 'blk_cp1',
    version: 1,
    question: 'Which contact is normally open?',
    choices: [
      { id: 'ch_a', text: 'NO contact' },
      { id: 'ch_b', text: 'NC contact' },
    ],
    correct_choice_id: 'ch_a',
    hint: 'The symbol looks like a broken line.',
    gate: 'section',
  }

  it('accepts a valid checkpoint and rejects malformed authoring', () => {
    const saved = validateLessonBodyForSave([validCheckpoint])
    assert.equal(saved.ok, true)
    if (!saved.ok) return
    assert.equal(saved.blocks[0]?.type, 'checkpoint')

    assert.equal(validateLessonBodyForSave([{ ...validCheckpoint, question: '' }]).ok, false)
    assert.equal(validateLessonBodyForSave([{ ...validCheckpoint, hint: '' }]).ok, false)
    assert.equal(
      validateLessonBodyForSave([{ ...validCheckpoint, choices: [{ id: 'ch_a', text: 'Only one' }] }]).ok,
      false
    )
    assert.equal(
      validateLessonBodyForSave([
        {
          ...validCheckpoint,
          choices: [
            { id: 'ch_dup', text: 'A' },
            { id: 'ch_dup', text: 'B' },
          ],
        },
      ]).ok,
      false
    )
    assert.equal(
      validateLessonBodyForSave([{ ...validCheckpoint, correct_choice_id: 'ch_missing' }]).ok,
      false
    )
    assert.equal(validateLessonBodyForSave([{ ...validCheckpoint, gate: 'chapter' }]).ok, false)
    assert.equal(validateLessonBodyForSave([{ type: 'checkpoint', id: 'blk_bad' }]).ok, false)
  })

  it('strips the answer key and hint from student projection and preview', () => {
    const authored = parseLessonBody([validCheckpoint])
    assert.equal(authored[0]?.type, 'checkpoint')
    if (authored[0]?.type !== 'checkpoint') return
    assert.equal(authored[0].correct_choice_id, 'ch_a')
    assert.equal(authored[0].hint, validCheckpoint.hint)

    const student = projectLessonBlocksForStudent(authored)
    const preview = previewLessonBlocks([validCheckpoint])
    assert.deepEqual(student, preview)
    assert.equal(student[0]?.type, 'checkpoint')
    if (student[0]?.type !== 'checkpoint') return
    assert.equal(student[0].question, validCheckpoint.question)
    assert.deepEqual(
      student[0].choices.map((choice) => choice.id),
      ['ch_a', 'ch_b']
    )
    assert.equal('correct_choice_id' in student[0], false)
    assert.equal('hint' in student[0], false)
    assert.doesNotMatch(JSON.stringify(student), /correct_choice_id/)
    assert.doesNotMatch(JSON.stringify(student), /The symbol looks like a broken line/)
  })

  it('grades answers without returning the key and unlocks only after a pass', () => {
    const authored = parseLessonBody([validCheckpoint])
    const checkpoint = authored[0]
    assert.equal(checkpoint?.type, 'checkpoint')
    if (checkpoint?.type !== 'checkpoint') return

    const wrong = gradeCheckpointChoice(checkpoint, 'ch_b')
    assert.deepEqual(wrong, { ok: true, correct: false })
    const invalid = gradeCheckpointChoice(checkpoint, 'ch_z')
    assert.equal(invalid.ok, false)
    const right = gradeCheckpointChoice(checkpoint, 'ch_a')
    assert.deepEqual(right, { ok: true, correct: true })

    const firstWrong = nextCheckpointProgress({ existing: null, passed: false, now: '2026-01-01T00:00:00.000Z' })
    assert.equal(firstWrong.attempt_count, 1)
    assert.equal(firstWrong.passed_at, null)
    const thenRight = nextCheckpointProgress({
      existing: firstWrong,
      passed: true,
      now: '2026-01-01T00:01:00.000Z',
    })
    assert.equal(thenRight.attempt_count, 2)
    assert.equal(thenRight.passed_at, '2026-01-01T00:01:00.000Z')
    const repeat = nextCheckpointProgress({
      existing: thenRight,
      passed: true,
      now: '2026-01-01T00:02:00.000Z',
    })
    assert.equal(repeat.passed_at, '2026-01-01T00:01:00.000Z')
    assert.equal(repeat.attempt_count, 3)

    const later = { type: 'heading', text: 'After the gate' }
    const locked = visibleLessonBlocks(parseLessonBody([validCheckpoint, later]), [])
    assert.equal(locked.length, 1)
    assert.equal(locked[0]?.type, 'checkpoint')
    const unlocked = visibleLessonBlocks(parseLessonBody([validCheckpoint, later]), ['blk_cp1'])
    assert.equal(unlocked.length, 2)
  })

  it('lets multiple checkpoints gate independently and keeps old completion rules', () => {
    const second = {
      ...validCheckpoint,
      id: 'blk_cp2',
      correct_choice_id: 'ch_b',
    }
    const blocks = parseLessonBody([
      { type: 'heading', text: 'Start' },
      validCheckpoint,
      { type: 'rich_text', text: 'Middle' },
      second,
      { type: 'heading', text: 'End' },
    ])
    assert.deepEqual(
      visibleLessonBlocks(blocks, []).map((block) => block.type),
      ['heading', 'checkpoint']
    )
    assert.deepEqual(
      visibleLessonBlocks(blocks, ['blk_cp1']).map((block) => block.type),
      ['heading', 'checkpoint', 'rich_text', 'checkpoint']
    )
    assert.deepEqual(
      visibleLessonBlocks(blocks, ['blk_cp1', 'blk_cp2']).map((block) => block.type),
      ['heading', 'checkpoint', 'rich_text', 'checkpoint', 'heading']
    )

    assert.deepEqual(
      canCompleteCheckpointedLesson({
        alreadyCompleted: false,
        requiredCheckpointIds: ['blk_cp1', 'blk_cp2'],
        clearedBlockIds: ['blk_cp1'],
      }),
      { ok: false, unpassedIds: ['blk_cp2'] }
    )
    assert.deepEqual(
      canCompleteCheckpointedLesson({
        alreadyCompleted: false,
        requiredCheckpointIds: ['blk_cp1', 'blk_cp2'],
        clearedBlockIds: ['blk_cp1', 'blk_cp2'],
      }),
      { ok: true }
    )
    assert.deepEqual(
      canCompleteCheckpointedLesson({
        alreadyCompleted: true,
        requiredCheckpointIds: ['blk_cp1'],
        clearedBlockIds: [],
      }),
      { ok: true }
    )
    assert.deepEqual(
      canCompleteCheckpointedLesson({
        alreadyCompleted: false,
        requiredCheckpointIds: [],
        clearedBlockIds: [],
      }),
      { ok: true }
    )

    const empty = validateLessonBodyForSave([])
    assert.equal(empty.ok, true)
    assert.equal(lessonTypeRequiresUrl('video'), true)
    assert.equal(defaultVisibilityForLessonType('video'), 'published')
    assert.equal(isLessonUnlocked({ id: 'later', sort_order: 2, unlock_after_content_id: 'prereq' }, new Set(['prereq']), Date.now(), new Set(['prereq', 'later'])), true)
  })

  it('wires student APIs and completion to server-side checkpoint checks', () => {
    const route = readSrc('app/api/student/lesson-checkpoints/route.ts')
    const progress = readSrc('app/api/student/lesson-progress/route.ts')
    const integrity = readSrc('lib/learning/lesson-integrity.ts')
    const published = readSrc('lib/learning/published-lessons.ts')
    const viewer = readSrc('components/student/lesson-viewer.tsx')
    assert.match(route, /verifyEnrollmentLessonAccess/)
    assert.match(route, /getCurrentUser/)
    assert.match(route, /submitLessonCheckpoint/)
    assert.doesNotMatch(route, /correct_choice_id/)
    assert.match(progress, /alreadyCompleted: access.existing.completed/)
    assert.match(integrity, /assertLessonCheckpointsPassed/)
    assert.match(published, /projectLessonBlocksForStudent/)
    assert.match(viewer, /\/api\/student\/lesson-checkpoints/)
    assert.match(viewer, /gateCheckpoints/)
    const sql = readSrc('scripts/96-lesson-checkpoints.sql')
    assert.match(sql, /lesson_checkpoint_progress/)
    assert.match(sql, /UNIQUE \(user_id, content_id, block_id\)/)
    assert.doesNotMatch(readSrc('package.json'), /tiptap|quill|@tiptap/)
  })
})

