export const INTERACTIVE_LESSON_TYPE = 'interactive'

export function defaultVisibilityForLessonType(contentType: string): 'draft' | 'published' {
  return contentType === INTERACTIVE_LESSON_TYPE ? 'draft' : 'published'
}

export function lessonTypeRequiresUrl(contentType: string): boolean {
  return contentType !== INTERACTIVE_LESSON_TYPE
}

export function canPublishAuthoredLesson(input: {
  title: string
  contentType: string
  contentUrl?: string | null
  blockCount: number
}): { ok: true } | { ok: false; error: string } {
  if (!input.title.trim()) return { ok: false, error: 'Lesson title is required' }

  if (input.contentType === INTERACTIVE_LESSON_TYPE) {
    if (input.blockCount < 1) {
      return { ok: false, error: 'Add at least one content block before publishing' }
    }
    return { ok: true }
  }

  if (!input.contentUrl?.trim()) {
    return { ok: false, error: 'Add a URL or upload a file before publishing' }
  }
  return { ok: true }
}
