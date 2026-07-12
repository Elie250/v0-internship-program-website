import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerSession, applyDeliveryProgramScope } from '@/lib/lecturer/access'
import { queryCourseProgressForStudents } from '@/lib/learning/lesson-progress'

/** All admitted students across programmes assigned to the logged-in lecturer. */
export async function GET() {
  try {
    const user = await requireLecturerSession()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    let coursesQuery = supabaseAdmin
      .from('courses')
      .select('id, title')
      .eq('instructor_id', user.id)

    coursesQuery = applyDeliveryProgramScope(coursesQuery, user.role)

    const { data: courses, error: coursesError } = await coursesQuery.order('title', { ascending: true })

    if (coursesError) {
      return NextResponse.json({ error: coursesError.message }, { status: 500 })
    }

    const courseList = courses ?? []
    if (courseList.length === 0) {
      return NextResponse.json({ students: [], summary: { total: 0, atRisk: 0 } })
    }

    const courseIds = courseList.map((c) => c.id)
    const titleById = new Map(courseList.map((c) => [c.id, c.title]))

    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from('course_enrollments')
      .select('id, course_id, user_id, applicant_name, applicant_email, applicant_phone, status')
      .in('course_id', courseIds)
      .eq('status', 'admitted')
      .order('applicant_name', { ascending: true })

    if (enrollError) {
      return NextResponse.json({ error: enrollError.message }, { status: 500 })
    }

    const now = Date.now()
    const INACTIVE_DAYS = 7
    const rows: Array<{
      enrollmentId: string
      courseId: string
      courseTitle: string
      userId: string | null
      name: string
      email: string
      phone: string | null
      progressPercent: number
      completedLessons: number
      totalLessons: number
      lastActivityAt: string | null
      daysSinceActivity: number | null
      atRisk: boolean
    }> = []

    for (const courseId of courseIds) {
      const courseEnrollments = (enrollments ?? []).filter((e) => e.course_id === courseId)
      const userIds = courseEnrollments.map((e) => e.user_id).filter(Boolean) as string[]
      const progressMap = await queryCourseProgressForStudents(courseId, userIds)

      for (const e of courseEnrollments) {
        const uid = e.user_id as string | null
        const progress = uid ? progressMap.get(uid) : undefined
        const lastActivityAt = progress?.lastActivityAt ?? null
        const daysSinceActivity = lastActivityAt
          ? Math.floor((now - new Date(lastActivityAt).getTime()) / 86_400_000)
          : null
        const percent = progress?.percent ?? 0
        const atRisk =
          percent < 100 &&
          (lastActivityAt === null || (daysSinceActivity ?? 0) >= INACTIVE_DAYS)

        rows.push({
          enrollmentId: e.id,
          courseId,
          courseTitle: titleById.get(courseId) ?? 'Programme',
          userId: uid,
          name: e.applicant_name,
          email: e.applicant_email,
          phone: (e.applicant_phone as string | null) ?? null,
          progressPercent: percent,
          completedLessons: progress?.completed ?? 0,
          totalLessons: progress?.total ?? 0,
          lastActivityAt,
          daysSinceActivity,
          atRisk,
        })
      }
    }

    rows.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      students: rows,
      summary: {
        total: rows.length,
        atRisk: rows.filter((r) => r.atRisk).length,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load students'
    const status = message === 'Unauthorized' || message.includes('Lecturer') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
