import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { SESSION_SELECT_BASE, MISSING_TABLE } from '@/lib/learning/classroom-sessions'

export type ClassroomSessionRow = {
  id: string
  topic: string
  scheduledAt: string
  durationMinutes: number | null
  meetingLink: string | null
  location: string | null
  courseId: string
  courseTitle: string
  instructorName: string | null
  instructorEmail: string | null
}

export async function queryClassroomMonitor(filters?: {
  window?: 'upcoming' | 'past' | 'all'
  limit?: number
}): Promise<{ sessions: ClassroomSessionRow[]; error?: string }> {
  if (!supabaseAdmin) {
    return { sessions: [], error: 'Database not configured' }
  }

  const limit = filters?.limit ?? 80
  const window = filters?.window ?? 'upcoming'
  const now = new Date().toISOString()

  let query = supabaseAdmin
    .from('course_sessions')
    .select(
      `${SESSION_SELECT_BASE}, course_id, course:courses(id, title, instructor_id, instructor:users(first_name, last_name, email))`
    )
    .order('scheduled_at', { ascending: window !== 'past' })
    .limit(limit)

  if (window === 'upcoming') {
    query = query.gte('scheduled_at', now)
  } else if (window === 'past') {
    query = query.lt('scheduled_at', now)
  }

  const { data, error } = await query
  if (error) {
    if (MISSING_TABLE.test(error.message)) return { sessions: [] }
    return { sessions: [], error: error.message }
  }

  const sessions: ClassroomSessionRow[] = (data ?? []).map((row) => {
    const courseRel = row.course as
      | {
          id?: string
          title?: string
          instructor?: { first_name?: string; last_name?: string; email?: string } | null
        }
      | Array<{
          id?: string
          title?: string
          instructor?: { first_name?: string; last_name?: string; email?: string } | null
        }>
      | null

    const course = Array.isArray(courseRel) ? courseRel[0] : courseRel
    const instructor = course?.instructor
    const instructorName = instructor
      ? [instructor.first_name, instructor.last_name].filter(Boolean).join(' ') || null
      : null

    return {
      id: String(row.id),
      topic: String(row.topic ?? 'Session'),
      scheduledAt: String(row.scheduled_at),
      durationMinutes: row.duration_minutes != null ? Number(row.duration_minutes) : null,
      meetingLink: (row.meeting_link as string | null) ?? null,
      location: (row.location as string | null) ?? null,
      courseId: String(row.course_id ?? course?.id ?? ''),
      courseTitle: String(course?.title ?? 'Course'),
      instructorName,
      instructorEmail: instructor?.email ?? null,
    }
  })

  return { sessions }
}
