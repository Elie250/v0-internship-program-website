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

  let sessionQuery = supabaseAdmin
    .from('course_sessions')
    .select(`${SESSION_SELECT_BASE}, course_id`)
    .order('scheduled_at', { ascending: window !== 'past' })
    .limit(limit)

  if (window === 'upcoming') {
    sessionQuery = sessionQuery.gte('scheduled_at', now)
  } else if (window === 'past') {
    sessionQuery = sessionQuery.lt('scheduled_at', now)
  }

  const { data: sessionRows, error: sessionError } = await sessionQuery
  if (sessionError) {
    if (MISSING_TABLE.test(sessionError.message)) return { sessions: [] }
    return { sessions: [], error: sessionError.message }
  }

  const rows = sessionRows ?? []
  const courseIds = [...new Set(rows.map((row) => String(row.course_id ?? '')).filter(Boolean))]

  let coursesById = new Map<
    string,
    { title: string; instructorId: string | null }
  >()
  if (courseIds.length) {
    const { data: courses, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, title, instructor_id')
      .in('id', courseIds)

    if (courseError) return { sessions: [], error: courseError.message }

    for (const course of courses ?? []) {
      coursesById.set(String(course.id), {
        title: String(course.title ?? 'Course'),
        instructorId: (course.instructor_id as string | null) ?? null,
      })
    }
  }

  const instructorIds = [
    ...new Set(
      [...coursesById.values()]
        .map((course) => course.instructorId)
        .filter((id): id is string => Boolean(id))
    ),
  ]

  let instructorsById = new Map<
    string,
    { fullName: string; email: string }
  >()
  if (instructorIds.length) {
    const { data: instructors, error: instructorError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', instructorIds)

    if (instructorError) return { sessions: [], error: instructorError.message }

    for (const user of instructors ?? []) {
      const fullName =
        [user.first_name, user.last_name].filter(Boolean).join(' ') ||
        String(user.email ?? 'Lecturer')
      instructorsById.set(String(user.id), {
        fullName,
        email: String(user.email ?? ''),
      })
    }
  }

  const sessions: ClassroomSessionRow[] = rows.map((row) => {
    const courseId = String(row.course_id ?? '')
    const course = coursesById.get(courseId)
    const instructor = course?.instructorId
      ? instructorsById.get(course.instructorId)
      : undefined

    return {
      id: String(row.id),
      topic: String(row.topic ?? 'Session'),
      scheduledAt: String(row.scheduled_at),
      durationMinutes: row.duration_minutes != null ? Number(row.duration_minutes) : null,
      meetingLink: (row.meeting_link as string | null) ?? null,
      location: (row.location as string | null) ?? null,
      courseId,
      courseTitle: course?.title ?? 'Course',
      instructorName: instructor?.fullName ?? null,
      instructorEmail: instructor?.email ?? null,
    }
  })

  return { sessions }
}
