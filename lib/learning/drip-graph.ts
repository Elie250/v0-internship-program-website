export type DripEdge = {
  id: string
  unlockAfterContentId: string | null
  visibility?: string | null
}

function isPublished(visibility: string | null | undefined): boolean {
  if (visibility == null) return true
  const raw = String(visibility).trim().toLowerCase()
  if (!raw) return true
  return raw === 'published'
}

/**
 * Detect whether assigning `prerequisiteId` as unlock_after for `lessonId`
 * would create a cycle in the course drip graph.
 */
export function wouldCreateDripCycle(
  lessons: DripEdge[],
  lessonId: string,
  prerequisiteId: string | null
): boolean {
  if (!prerequisiteId) return false
  if (prerequisiteId === lessonId) return true

  const afterById = new Map<string, string | null>()
  for (const lesson of lessons) {
    afterById.set(lesson.id, lesson.unlockAfterContentId)
  }
  // Prospective edge
  afterById.set(lessonId, prerequisiteId)

  const seen = new Set<string>()
  let cursor: string | null = prerequisiteId
  while (cursor) {
    if (cursor === lessonId) return true
    if (seen.has(cursor)) return true
    seen.add(cursor)
    cursor = afterById.get(cursor) ?? null
  }
  return false
}

export function validateDripPrerequisite(input: {
  lessons: DripEdge[]
  lessonId: string
  prerequisiteId: string | null
  requirePublishedPrerequisite?: boolean
}): { ok: true } | { ok: false; error: string; code?: string } {
  const { lessons, lessonId, prerequisiteId } = input
  if (!prerequisiteId) return { ok: true }

  const prereq = lessons.find((row) => row.id === prerequisiteId)
  if (!prereq) {
    return { ok: false, error: 'Prerequisite lesson must belong to this course.', code: 'missing' }
  }
  if (prerequisiteId === lessonId) {
    return { ok: false, error: 'A lesson cannot unlock after itself.', code: 'self' }
  }
  if (input.requirePublishedPrerequisite !== false && !isPublished(prereq.visibility)) {
    return {
      ok: false,
      error: 'Select a published lesson as the drip prerequisite (draft prerequisites are ignored for students).',
      code: 'unpublished',
    }
  }
  if (wouldCreateDripCycle(lessons, lessonId, prerequisiteId)) {
    return {
      ok: false,
      error: 'That prerequisite would create a circular unlock chain.',
      code: 'cycle',
    }
  }
  return { ok: true }
}

export function draftPrerequisiteWarning(
  lessons: DripEdge[],
  unlockAfterContentId: string | null | undefined
): string | null {
  if (!unlockAfterContentId) return null
  const prereq = lessons.find((row) => row.id === unlockAfterContentId)
  if (!prereq) return 'Configured drip prerequisite is missing from this course.'
  if (!isPublished(prereq.visibility)) {
    return 'Drip prerequisite is currently a draft. Students will not be gated by it until it is published.'
  }
  return null
}
