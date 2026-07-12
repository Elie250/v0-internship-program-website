import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { courseNotificationCount } from '@/lib/admin/course-notifications'
import { filterActionablePendingEnrollments } from '@/lib/enrollment/actionable-pending'

export type CourseNotificationRow = {
  courseId: string
  title: string
  status: string
  notificationCount: number
  pendingEnrollments: number
  pendingCertificates: number
}

export async function queryCourseNotificationRows(): Promise<{
  rows: CourseNotificationRow[]
  totalNotifications: number
  error?: string
}> {
  if (!supabaseAdmin) {
    return { rows: [], totalNotifications: 0, error: 'Database not configured' }
  }

  const { data: courses, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('id, title, status')
    .order('title', { ascending: true })
    .limit(100)

  if (courseError) {
    return { rows: [], totalNotifications: 0, error: courseError.message }
  }

  const courseList = courses ?? []
  if (!courseList.length) {
    return { rows: [], totalNotifications: 0 }
  }

  const courseIds = courseList.map((c) => String(c.id))

  const [enrollmentsResult, certsResult] = await Promise.all([
    supabaseAdmin
      .from('course_enrollments')
      .select('course_id, payment_id')
      .in('course_id', courseIds)
      .eq('status', 'payment_pending_review'),
    supabaseAdmin
      .from('student_certificates')
      .select('course_id')
      .in('course_id', courseIds)
      .eq('status', 'pending_admin'),
  ])

  const pendingEnrollmentsByCourse = new Map<string, number>()
  if (!enrollmentsResult.error) {
    const actionable = await filterActionablePendingEnrollments(enrollmentsResult.data ?? [])
    for (const row of actionable) {
      const id = String(row.course_id)
      pendingEnrollmentsByCourse.set(id, (pendingEnrollmentsByCourse.get(id) ?? 0) + 1)
    }
  }

  const pendingCertsByCourse = new Map<string, number>()
  if (!certsResult.error) {
    for (const row of certsResult.data ?? []) {
      const id = String(row.course_id)
      pendingCertsByCourse.set(id, (pendingCertsByCourse.get(id) ?? 0) + 1)
    }
  }

  const rows: CourseNotificationRow[] = courseList.map((course) => {
    const courseId = String(course.id)
    const status = String(course.status ?? 'draft')
    const pendingEnrollments = pendingEnrollmentsByCourse.get(courseId) ?? 0
    const pendingCertificates = pendingCertsByCourse.get(courseId) ?? 0
    const notificationCount = courseNotificationCount({
      status,
      pendingEnrollments,
      pendingCertificates,
    })

    return {
      courseId,
      title: String(course.title ?? 'Programme'),
      status,
      notificationCount,
      pendingEnrollments,
      pendingCertificates,
    }
  })

  const totalNotifications = rows.reduce((sum, row) => sum + row.notificationCount, 0)

  return { rows, totalNotifications }
}
