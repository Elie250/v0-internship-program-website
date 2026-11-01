import {
  isCourseContentType,
  requiresContentUrl,
  type CourseContentType,
} from '@/lib/learning/course-content-types'
import {
  canPublishAuthoredLesson,
  defaultVisibilityForLessonType,
} from '@/lib/learning/lesson-authoring-rules'
import {
  validateLessonBodyForSave,
  type LessonBlock,
} from '@/lib/learning/lesson-blocks'
import {
  LESSON_VISIBILITIES,
  type LessonVisibility,
} from '@/lib/learning/lesson-visibility'

export {
  AUTHORABLE_BLOCK_TYPES,
  createEmptyLessonBlock,
  editorBlocksAreDirty,
  lessonBlocksToEditor,
  moveLessonBlock,
  previewLessonBlocks,
  removeLessonBlock,
  validateLessonBodyForSave,
  type EditorLessonBlock,
} from '@/lib/learning/lesson-blocks'

export type NormalizedLessonAuthoring = {
  title: string
  contentType: CourseContentType
  contentUrl: string | null
  body: LessonBlock[]
  visibility: LessonVisibility
}

export function defaultVisibilityForContentType(contentType: CourseContentType): LessonVisibility {
  return defaultVisibilityForLessonType(contentType)
}

export function parseLessonVisibility(value: unknown, fallback: LessonVisibility): LessonVisibility {
  if (value == null || value === '') return fallback
  const raw = String(value).trim().toLowerCase()
  return LESSON_VISIBILITIES.includes(raw as LessonVisibility) ? (raw as LessonVisibility) : fallback
}

export function normalizeLessonAuthoringInput(input: {
  title: string
  contentType: string
  contentUrl?: string | null
  body?: unknown
  visibility?: string | null
}): { ok: true; value: NormalizedLessonAuthoring } | { ok: false; error: string } {
  const title = input.title.trim()
  if (!title) return { ok: false, error: 'Lesson title is required' }

  if (!isCourseContentType(input.contentType)) {
    return { ok: false, error: 'Unsupported lesson type' }
  }

  const contentType = input.contentType
  const contentUrl = input.contentUrl?.trim() || null
  if (requiresContentUrl(contentType) && !contentUrl) {
    return { ok: false, error: 'Add a URL or upload a file' }
  }

  const bodyResult = validateLessonBodyForSave(input.body ?? [])
  if (!bodyResult.ok) return bodyResult

  return {
    ok: true,
    value: {
      title,
      contentType,
      contentUrl,
      body: bodyResult.blocks,
      visibility: parseLessonVisibility(input.visibility, defaultVisibilityForContentType(contentType)),
    },
  }
}

export function validateLessonForPublish(
  value: NormalizedLessonAuthoring
): { ok: true } | { ok: false; error: string } {
  return canPublishAuthoredLesson({
    title: value.title,
    contentType: value.contentType,
    contentUrl: value.contentUrl,
    blockCount: value.body.length,
  })
}
