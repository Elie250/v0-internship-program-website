import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const MIN_LESSON_SECONDS = 45
export const MIN_VIDEO_WATCH_PERCENT = 80
export const MAX_HEARTBEAT_SECONDS = 20

export type LessonContentType = 'video' | 'pdf' | 'document' | 'download' | 'webinar' | 'link' | string

export function minSecondsForLesson(contentType: LessonContentType): number {
  if (contentType === 'video' || contentType === 'webinar') return MIN_LESSON_SECONDS
  if (contentType === 'pdf' || contentType === 'document') return MIN_LESSON_SECONDS
  return MIN_LESSON_SECONDS
}

export function canMarkLessonComplete(input: {
  contentType: LessonContentType
  timeSpentSeconds: number
  watchPercent: number
  alreadyCompleted: boolean
}): { ok: true } | { ok: false; reason: string } {
  if (input.alreadyCompleted) return { ok: true }

  const minSeconds = minSecondsForLesson(input.contentType)
  if (input.timeSpentSeconds < minSeconds) {
    return {
      ok: false,
      reason: `Spend at least ${minSeconds} seconds on this lesson before marking it complete.`,
    }
  }

  if (input.contentType === 'video' && input.watchPercent < MIN_VIDEO_WATCH_PERCENT) {
    return {
      ok: false,
      reason: `Watch at least ${MIN_VIDEO_WATCH_PERCENT}% of the video before marking it complete.`,
    }
  }

  return { ok: true }
}

function isMissingIntegrityColumn(message: string | undefined): boolean {
  const msg = message ?? ''
  return (
    (msg.includes('time_spent_seconds') ||
      msg.includes('watch_percent') ||
      msg.includes('completion_verified')) &&
    (msg.includes('does not exist') || msg.includes('schema cache'))
  )
}

export const LESSON_INTEGRITY_HINT =
  'Lesson integrity columns missing. Run scripts/35-assessment-integrity.sql in Supabase.'

export async function verifyEnrollmentLessonAccess(
  userId: string,
  courseId: string,
  contentId: string
): Promise<
  | {
      ok: true
      enrollmentId: string
      contentType: string
      existing: {
        timeSpentSeconds: number
        watchPercent: number
        completed: boolean
        completionVerified: boolean
      }
    }
  | { ok: false; error: string }
> {
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured' }

  const { data: enrollment } = await supabaseAdmin
    .from('course_enrollments')
    .select('id, status')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .eq('status', 'admitted')
    .maybeSingle()

  if (!enrollment) {
    return { ok: false, error: 'You are not admitted to this programme' }
  }

  const { data: content } = await supabaseAdmin
    .from('course_content')
    .select('id, content_type')
    .eq('id', contentId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (!content) {
    return { ok: false, error: 'Lesson not found in this course' }
  }

  const { data: progress } = await supabaseAdmin
    .from('lesson_progress')
    .select('time_spent_seconds, watch_percent, completed_at, completion_verified')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .maybeSingle()

  return {
    ok: true,
    enrollmentId: enrollment.id,
    contentType: String(content.content_type ?? 'link'),
    existing: {
      timeSpentSeconds: Number(progress?.time_spent_seconds ?? 0),
      watchPercent: Number(progress?.watch_percent ?? 0),
      completed: Boolean(progress?.completed_at),
      completionVerified: Boolean(progress?.completion_verified),
    },
  }
}

export async function recordLessonHeartbeat(input: {
  userId: string
  courseId: string
  contentId: string
  enrollmentId: string
  elapsedSeconds?: number
  watchPercent?: number
}): Promise<
  | { success: true; tableReady?: boolean; timeSpentSeconds: number; watchPercent: number }
  | { success: false; error: string; tableReady?: boolean }
> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const elapsed = Math.min(
    Math.max(0, Math.floor(Number(input.elapsedSeconds ?? MAX_HEARTBEAT_SECONDS))),
    MAX_HEARTBEAT_SECONDS
  )
  const watchPercent =
    input.watchPercent != null
      ? Math.min(100, Math.max(0, Math.floor(Number(input.watchPercent))))
      : undefined

  const { data: existing } = await supabaseAdmin
    .from('lesson_progress')
    .select('time_spent_seconds, watch_percent')
    .eq('user_id', input.userId)
    .eq('content_id', input.contentId)
    .maybeSingle()

  const now = new Date().toISOString()
  const payload: Record<string, unknown> = {
    user_id: input.userId,
    course_id: input.courseId,
    content_id: input.contentId,
    enrollment_id: input.enrollmentId,
    last_opened_at: now,
    updated_at: now,
    time_spent_seconds: Number(existing?.time_spent_seconds ?? 0) + elapsed,
    watch_percent:
      watchPercent != null
        ? Math.max(Number(existing?.watch_percent ?? 0), watchPercent)
        : Number(existing?.watch_percent ?? 0),
  }

  const { error } = await supabaseAdmin.from('lesson_progress').upsert(payload, {
    onConflict: 'user_id,content_id',
  })

  if (error) {
    if (isMissingIntegrityColumn(error.message)) {
      return { success: false, error: LESSON_INTEGRITY_HINT, tableReady: false }
    }
    return { success: false, error: error.message }
  }

  return {
    success: true,
    tableReady: true,
    timeSpentSeconds: Number(payload.time_spent_seconds),
    watchPercent: Number(payload.watch_percent),
  }
}

export async function completeLessonWithIntegrity(input: {
  userId: string
  courseId: string
  contentId: string
  enrollmentId: string
  contentType: string
  timeSpentSeconds: number
  watchPercent: number
}): Promise<{ success: boolean; error?: string; tableReady?: boolean }> {
  const gate = canMarkLessonComplete({
    contentType: input.contentType,
    timeSpentSeconds: input.timeSpentSeconds,
    watchPercent: input.watchPercent,
    alreadyCompleted: false,
  })

  if (!gate.ok) {
    return { success: false, error: gate.reason }
  }

  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const now = new Date().toISOString()
  const { error } = await supabaseAdmin.from('lesson_progress').upsert(
    {
      user_id: input.userId,
      course_id: input.courseId,
      content_id: input.contentId,
      enrollment_id: input.enrollmentId,
      completed_at: now,
      completion_verified: true,
      time_spent_seconds: input.timeSpentSeconds,
      watch_percent: input.watchPercent,
      last_opened_at: now,
      updated_at: now,
    },
    { onConflict: 'user_id,content_id' }
  )

  if (error) {
    if (isMissingIntegrityColumn(error.message)) {
      return { success: false, error: LESSON_INTEGRITY_HINT, tableReady: false }
    }
    return { success: false, error: error.message }
  }

  return { success: true, tableReady: true }
}

export async function courseLessonsComplete(
  userId: string,
  courseId: string
): Promise<{ complete: boolean; total: number; completed: number }> {
  if (!supabaseAdmin) return { complete: false, total: 0, completed: 0 }

  const { data: lessons } = await supabaseAdmin
    .from('course_content')
    .select('id')
    .eq('course_id', courseId)

  const lessonIds = (lessons ?? []).map((l) => String(l.id))
  if (!lessonIds.length) return { complete: true, total: 0, completed: 0 }

  const { data: progress } = await supabaseAdmin
    .from('lesson_progress')
    .select('content_id, completed_at, completion_verified')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .in('content_id', lessonIds)

  const verified = new Set(
    (progress ?? [])
      .filter((row) => row.completed_at && row.completion_verified !== false)
      .map((row) => String(row.content_id))
  )

  return {
    total: lessonIds.length,
    completed: verified.size,
    complete: verified.size === lessonIds.length,
  }
}
