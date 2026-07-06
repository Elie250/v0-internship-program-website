export type DripLesson = {
  id: string
  sort_order: number
  unlock_at?: string | null
  unlock_after_content_id?: string | null
}

export function isLessonUnlocked(
  lesson: DripLesson,
  completedContentIds: Set<string>,
  now = Date.now()
): boolean {
  if (lesson.unlock_at) {
    const unlockMs = new Date(lesson.unlock_at).getTime()
    if (!Number.isNaN(unlockMs) && now < unlockMs) return false
  }
  if (lesson.unlock_after_content_id) {
    if (!completedContentIds.has(lesson.unlock_after_content_id)) return false
  }
  return true
}

export function filterUnlockedLessons<T extends DripLesson>(
  lessons: T[],
  completedContentIds: Set<string>,
  now = Date.now()
): T[] {
  return lessons.filter((lesson) => isLessonUnlocked(lesson, completedContentIds, now))
}
