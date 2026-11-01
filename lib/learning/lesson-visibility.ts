export const LESSON_VISIBILITIES = ['draft', 'published'] as const
export type LessonVisibility = (typeof LESSON_VISIBILITIES)[number]

/** Missing / empty visibility is treated as published (pre-migration rows). */
export function isPublishedLessonVisibility(value: unknown): boolean {
  if (value == null) return true
  const raw = String(value).trim().toLowerCase()
  if (!raw) return true
  return raw === 'published'
}

export function normalizeLessonVisibility(value: unknown): LessonVisibility {
  return isPublishedLessonVisibility(value) ? 'published' : 'draft'
}

export function filterPublishedLessonRows<T extends { visibility?: unknown }>(rows: T[]): T[] {
  return rows.filter((row) => isPublishedLessonVisibility(row.visibility))
}

export function publishedLessonIdsFromRows<T extends { id: string; visibility?: unknown }>(
  rows: T[]
): string[] {
  return filterPublishedLessonRows(rows).map((row) => row.id)
}

/**
 * Fail closed: a visibility-aware load error must never be replaced with
 * an unfiltered course_content id list.
 */
export function requirePublishedLessonIds(result: { ids: string[] } | { error: string }): string[] {
  if ('error' in result) {
    throw new Error(result.error)
  }
  return result.ids
}

export function completionFromPublishedLessons(
  publishedIds: string[],
  verifiedContentIds: Iterable<string>
): { complete: boolean; total: number; completed: number } {
  const total = publishedIds.length
  if (total === 0) return { complete: true, total: 0, completed: 0 }

  const published = new Set(publishedIds)
  let completed = 0
  for (const id of verifiedContentIds) {
    if (published.has(id)) completed += 1
  }

  return {
    total,
    completed,
    complete: completed === total,
  }
}

export function isMissingLessonSchemaColumn(message: string | undefined): boolean {
  const msg = message ?? ''
  return /column .* does not exist|could not find the .* column|schema cache/i.test(msg)
}
