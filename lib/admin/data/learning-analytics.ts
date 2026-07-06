import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { queryCourseProgressForStudents } from '@/lib/learning/lesson-progress'

export type CourseAnalyticsRow = {
  courseId: string
  title: string
  status: string
  instructorName: string | null
  totalEnrollments: number
  admittedCount: number
  pendingCount: number
  avgProgressPercent: number
  upcomingSessions: number
  pendingCertificates: number
  atRiskStudents: number
}

export async function queryLearningAnalytics(): Promise<{
  courses: CourseAnalyticsRow[]
  error?: string
}> {
  if (!supabaseAdmin) {
    return { courses: [], error: 'Database not configured' }
  }

  const { data: courseRows, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('id, title, status, instructor_id')
    .order('title', { ascending: true })
    .limit(100)

  if (courseError) return { courses: [], error: courseError.message }

  const courses = courseRows ?? []
  if (!courses.length) return { courses: [] }

  const courseIds = courses.map((c) => String(c.id))
  const instructorIds = [
    ...new Set(
      courses
        .map((c) => c.instructor_id as string | null)
        .filter((id): id is string => Boolean(id))
    ),
  ]

  const now = new Date().toISOString()
  const INACTIVE_DAYS = 7

  const [enrollmentsResult, sessionsResult, certsResult, instructorsResult] =
    await Promise.all([
      supabaseAdmin
        .from('course_enrollments')
        .select('course_id, status, user_id')
        .in('course_id', courseIds),
      supabaseAdmin
        .from('course_sessions')
        .select('course_id')
        .in('course_id', courseIds)
        .gte('scheduled_at', now),
      supabaseAdmin
        .from('student_certificates')
        .select('course_id, status')
        .in('course_id', courseIds)
        .eq('status', 'pending_admin'),
      instructorIds.length
        ? supabaseAdmin
            .from('users')
            .select('id, first_name, last_name')
            .in('id', instructorIds)
        : Promise.resolve({ data: [], error: null }),
    ])

  if (enrollmentsResult.error) {
    return { courses: [], error: enrollmentsResult.error.message }
  }

  const instructorsById = new Map<string, string>()
  for (const user of instructorsResult.data ?? []) {
    instructorsById.set(
      String(user.id),
      [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Lecturer'
    )
  }

  const enrollmentsByCourse = new Map<
    string,
    Array<{ status: string; userId: string | null }>
  >()
  for (const row of enrollmentsResult.data ?? []) {
    const courseId = String(row.course_id)
    const list = enrollmentsByCourse.get(courseId) ?? []
    list.push({
      status: String(row.status ?? ''),
      userId: (row.user_id as string | null) ?? null,
    })
    enrollmentsByCourse.set(courseId, list)
  }

  const upcomingByCourse = new Map<string, number>()
  if (!sessionsResult.error) {
    for (const row of sessionsResult.data ?? []) {
      const courseId = String(row.course_id)
      upcomingByCourse.set(courseId, (upcomingByCourse.get(courseId) ?? 0) + 1)
    }
  }

  const pendingCertsByCourse = new Map<string, number>()
  if (!certsResult.error) {
    for (const row of certsResult.data ?? []) {
      const courseId = String(row.course_id)
      pendingCertsByCourse.set(courseId, (pendingCertsByCourse.get(courseId) ?? 0) + 1)
    }
  }

  const analytics: CourseAnalyticsRow[] = []

  for (const course of courses) {
    const courseId = String(course.id)
    const enrollments = enrollmentsByCourse.get(courseId) ?? []
    const admitted = enrollments.filter((e) => e.status === 'admitted')
    const pending = enrollments.filter((e) =>
      ['payment_pending_review', 'waitlisted'].includes(e.status)
    )

    const admittedUserIds = admitted
      .map((e) => e.userId)
      .filter((id): id is string => Boolean(id))

    let avgProgressPercent = 0
    let atRiskStudents = 0

    if (admittedUserIds.length) {
      try {
        const progressMap = await queryCourseProgressForStudents(courseId, admittedUserIds)
        const percents: number[] = []
        const nowMs = Date.now()

        for (const uid of admittedUserIds) {
          const progress = progressMap.get(uid)
          const percent = progress?.percent ?? 0
          percents.push(percent)

          const lastActivity = progress?.lastActivityAt
          const daysSince = lastActivity
            ? Math.floor((nowMs - new Date(lastActivity).getTime()) / 86_400_000)
            : null
          if (percent < 100 && (lastActivity === null || (daysSince ?? 0) >= INACTIVE_DAYS)) {
            atRiskStudents += 1
          }
        }

        avgProgressPercent =
          percents.length === 0
            ? 0
            : Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length)
      } catch {
        avgProgressPercent = 0
      }
    }

    analytics.push({
      courseId,
      title: String(course.title ?? 'Course'),
      status: String(course.status ?? 'draft'),
      instructorName: course.instructor_id
        ? instructorsById.get(String(course.instructor_id)) ?? null
        : null,
      totalEnrollments: enrollments.length,
      admittedCount: admitted.length,
      pendingCount: pending.length,
      avgProgressPercent,
      upcomingSessions: upcomingByCourse.get(courseId) ?? 0,
      pendingCertificates: pendingCertsByCourse.get(courseId) ?? 0,
      atRiskStudents,
    })
  }

  return { courses: analytics }
}
