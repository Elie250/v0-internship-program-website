import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerSession } from '@/lib/lecturer/access'
import { queryCourseProgressForStudents } from '@/lib/learning/lesson-progress'

/**
 * Nav badge counts for the lecturer portal.
 * Keys: programmes | students | library
 */
export async function GET() {
  try {
    const user = await requireLecturerSession()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: courses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('id, status')
      .eq('instructor_id', user.id)

    if (coursesError) {
      return NextResponse.json({ error: coursesError.message }, { status: 500 })
    }

    const courseList = courses ?? []
    const courseIds = courseList.map((c) => String(c.id))
    const pendingReviewCourses = courseList.filter((c) => c.status === 'pending_review').length

    let pendingEnrollments = 0
    let atRisk = 0
    let pendingLibrary = 0
    let pendingCertificates = 0
    const enrollmentsByCourse = new Map<string, number>()
    const certsByCourse = new Map<string, number>()

    if (courseIds.length) {
      const [enrollmentsResult, certsResult, libraryResult] = await Promise.all([
        supabaseAdmin
          .from('course_enrollments')
          .select('course_id, user_id, status')
          .in('course_id', courseIds),
        supabaseAdmin
          .from('student_certificates')
          .select('id, course_id')
          .in('course_id', courseIds)
          .eq('status', 'pending_admin'),
        supabaseAdmin
          .from('energy_library_items')
          .select('id', { count: 'exact', head: true })
          .eq('uploaded_by', user.id)
          .eq('status', 'pending_review'),
      ])

      const enrollments = enrollmentsResult.data ?? []
      pendingEnrollments = enrollments.filter((e) => e.status === 'payment_pending_review').length

      for (const row of enrollments) {
        if (row.status !== 'payment_pending_review') continue
        const id = String(row.course_id)
        enrollmentsByCourse.set(id, (enrollmentsByCourse.get(id) ?? 0) + 1)
      }

      for (const row of certsResult.data ?? []) {
        const id = String(row.course_id)
        certsByCourse.set(id, (certsByCourse.get(id) ?? 0) + 1)
      }
      pendingCertificates = certsResult.error ? 0 : (certsResult.data ?? []).length

      if (!libraryResult.error) {
        pendingLibrary = libraryResult.count ?? 0
      }

      const admittedByCourse = new Map<string, string[]>()
      for (const row of enrollments) {
        if (row.status !== 'admitted' || !row.user_id) continue
        const list = admittedByCourse.get(String(row.course_id)) ?? []
        list.push(String(row.user_id))
        admittedByCourse.set(String(row.course_id), list)
      }

      const now = Date.now()
      const INACTIVE_DAYS = 7
      for (const [courseId, userIds] of admittedByCourse) {
        try {
          const progressMap = await queryCourseProgressForStudents(courseId, userIds)
          for (const uid of userIds) {
            const progress = progressMap.get(uid)
            const percent = progress?.percent ?? 0
            const lastActivity = progress?.lastActivityAt
            const daysSince = lastActivity
              ? Math.floor((now - new Date(lastActivity).getTime()) / 86_400_000)
              : null
            if (percent < 100 && (lastActivity === null || (daysSince ?? 0) >= INACTIVE_DAYS)) {
              atRisk += 1
            }
          }
        } catch {
          // skip progress errors
        }
      }
    } else {
      const { count, error } = await supabaseAdmin
        .from('energy_library_items')
        .select('id', { count: 'exact', head: true })
        .eq('uploaded_by', user.id)
        .eq('status', 'pending_review')
      if (!error) pendingLibrary = count ?? 0
    }

    const programmesCount = pendingReviewCourses + pendingEnrollments + pendingCertificates
    const badges: Record<string, number> = {}
    if (programmesCount > 0) badges.programmes = programmesCount
    if (atRisk > 0) badges.students = atRisk
    if (pendingLibrary > 0) badges.library = pendingLibrary

    return NextResponse.json({
      badges,
      details: {
        pendingReviewCourses,
        pendingEnrollments,
        pendingCertificates,
        atRisk,
        pendingLibrary,
      },
      courseNotifications: courseList.map((c) => {
        const courseId = String(c.id)
        const pending = enrollmentsByCourse.get(courseId) ?? 0
        const certs = certsByCourse.get(courseId) ?? 0
        return {
          courseId,
          status: String(c.status ?? 'draft'),
          pendingEnrollments: pending,
          pendingCertificates: certs,
          notificationCount: (c.status === 'pending_review' ? 1 : 0) + pending + certs,
        }
      }),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load badges'
    const status = message === 'Unauthorized' || message.includes('Lecturer') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
