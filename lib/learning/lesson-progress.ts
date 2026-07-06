import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type LessonProgressRecord = {
  contentId: string
  courseId: string
  completed: boolean
  completedAt: string | null
  lastOpenedAt: string
}

export type CourseProgressSummary = {
  totalLessons: number
  completedCount: number
  percent: number
  completedContentIds: string[]
  lastContentId: string | null
  resumeContentId: string | null
}

export function summarizeCourseProgress(
  lessonIds: string[],
  records: LessonProgressRecord[]
): CourseProgressSummary {
  const totalLessons = lessonIds.length
  const byContent = new Map(records.map((r) => [r.contentId, r]))
  const completedContentIds = lessonIds.filter((id) => byContent.get(id)?.completed)
  const completedCount = completedContentIds.length
  const percent =
    totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100)

  let lastContentId: string | null = null
  let lastOpened = 0
  for (const record of records) {
    const ts = new Date(record.lastOpenedAt).getTime()
    if (ts >= lastOpened) {
      lastOpened = ts
      lastContentId = record.contentId
    }
  }

  const resumeContentId =
    lessonIds.find((id) => !completedContentIds.includes(id)) ??
    lastContentId ??
    lessonIds[0] ??
    null

  return {
    totalLessons,
    completedCount,
    percent,
    completedContentIds,
    lastContentId,
    resumeContentId,
  }
}

function isMissingProgressTable(error: { message?: string } | null): boolean {
  const msg = error?.message ?? ''
  return msg.includes('lesson_progress') && (msg.includes('does not exist') || msg.includes('schema cache'))
}

export async function queryLessonProgress(
  userId: string,
  courseIds: string[]
): Promise<{ records: LessonProgressRecord[]; tableReady: boolean }> {
  if (!supabaseAdmin || courseIds.length === 0) {
    return { records: [], tableReady: false }
  }

  const { data, error } = await supabaseAdmin
    .from('lesson_progress')
    .select('content_id, course_id, completed_at, last_opened_at')
    .eq('user_id', userId)
    .in('course_id', courseIds)

  if (error) {
    if (isMissingProgressTable(error)) {
      return { records: [], tableReady: false }
    }
    throw new Error(error.message)
  }

  const records: LessonProgressRecord[] = (data ?? []).map((row) => ({
    contentId: row.content_id as string,
    courseId: row.course_id as string,
    completed: Boolean(row.completed_at),
    completedAt: (row.completed_at as string | null) ?? null,
    lastOpenedAt: (row.last_opened_at as string) ?? new Date().toISOString(),
  }))

  return { records, tableReady: true }
}

export async function upsertLessonProgress(input: {
  userId: string
  courseId: string
  contentId: string
  enrollmentId?: string | null
  completed?: boolean
}): Promise<{ success: boolean; error?: string; tableReady?: boolean }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const now = new Date().toISOString()
  const payload: Record<string, unknown> = {
    user_id: input.userId,
    course_id: input.courseId,
    content_id: input.contentId,
    enrollment_id: input.enrollmentId ?? null,
    last_opened_at: now,
    updated_at: now,
  }

  if (input.completed === true) {
    payload.completed_at = now
  } else if (input.completed === false) {
    payload.completed_at = null
  }

  const { error } = await supabaseAdmin.from('lesson_progress').upsert(payload, {
    onConflict: 'user_id,content_id',
  })

  if (error) {
    if (isMissingProgressTable(error)) {
      return {
        success: false,
        error: 'Progress tracking is not enabled yet. Ask admin to run scripts/24-lesson-progress.sql.',
        tableReady: false,
      }
    }
    return { success: false, error: error.message }
  }

  return { success: true, tableReady: true }
}

export type StudentCourseProgress = {
  completed: number
  total: number
  percent: number
  lastActivityAt: string | null
}

export async function queryCourseProgressForStudents(
  courseId: string,
  userIds: string[]
): Promise<Map<string, StudentCourseProgress>> {
  const result = new Map<string, StudentCourseProgress>()
  if (!supabaseAdmin || userIds.length === 0) return result

  const { data: lessons } = await supabaseAdmin
    .from('course_content')
    .select('id')
    .eq('course_id', courseId)

  const total = lessons?.length ?? 0
  if (total === 0) {
    for (const uid of userIds) {
      result.set(uid, { completed: 0, total: 0, percent: 0, lastActivityAt: null })
    }
    return result
  }

  const { data, error } = await supabaseAdmin
    .from('lesson_progress')
    .select('user_id, content_id, completed_at, last_opened_at')
    .eq('course_id', courseId)
    .in('user_id', userIds)

  if (error && !isMissingProgressTable(error)) {
    throw new Error(error.message)
  }

  const completedByUser = new Map<string, Set<string>>()
  const lastActivityByUser = new Map<string, string>()
  for (const row of data ?? []) {
    const uid = String(row.user_id)
    const opened = (row.last_opened_at as string | null) ?? null
    if (opened) {
      const prev = lastActivityByUser.get(uid)
      if (!prev || new Date(opened) > new Date(prev)) {
        lastActivityByUser.set(uid, opened)
      }
    }
    if (!row.completed_at) continue
    if (!completedByUser.has(uid)) completedByUser.set(uid, new Set())
    completedByUser.get(uid)!.add(String(row.content_id))
  }

  for (const uid of userIds) {
    const completed = completedByUser.get(uid)?.size ?? 0
    result.set(uid, {
      completed,
      total,
      percent: Math.round((completed / total) * 100),
      lastActivityAt: lastActivityByUser.get(uid) ?? null,
    })
  }

  return result
}
