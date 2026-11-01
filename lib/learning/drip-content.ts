export type DripLesson = {
  id: string
  sort_order: number
  unlock_at?: string | null
  unlock_after_content_id?: string | null
}

/**
 * Only published lessons may act as drip prerequisites.
 * A missing or draft prerequisite must not lock later published lessons.
 */
export function effectiveUnlockAfterContentId(
  prerequisiteId: string | null | undefined,
  publishedContentIds?: Iterable<string> | null
): string | null {
  if (!prerequisiteId) return null
  if (!publishedContentIds) return prerequisiteId
  const published = publishedContentIds instanceof Set ? publishedContentIds : new Set(publishedContentIds)
  return published.has(prerequisiteId) ? prerequisiteId : null
}

export function isLessonUnlocked(
  lesson: DripLesson,
  completedContentIds: Set<string>,
  now = Date.now(),
  publishedContentIds?: Iterable<string> | null
): boolean {
  if (lesson.unlock_at) {
    const unlockMs = new Date(lesson.unlock_at).getTime()
    if (!Number.isNaN(unlockMs) && now < unlockMs) return false
  }
  const prerequisiteId = effectiveUnlockAfterContentId(
    lesson.unlock_after_content_id,
    publishedContentIds
  )
  if (prerequisiteId && !completedContentIds.has(prerequisiteId)) return false
  return true
}

export function filterUnlockedLessons<T extends DripLesson>(
  lessons: T[],
  completedContentIds: Set<string>,
  now = Date.now(),
  publishedContentIds?: Iterable<string> | null
): T[] {
  const published = publishedContentIds ?? lessons.map((lesson) => lesson.id)
  return lessons.filter((lesson) =>
    isLessonUnlocked(lesson, completedContentIds, now, published)
  )
}
