import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import { queryCourseProgressForStudents } from '@/lib/learning/lesson-progress'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await context.params
    await requireLecturerCourseAccess(courseId)

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: enrollments, error } = await supabaseAdmin
      .from('course_enrollments')
      .select('id, user_id, applicant_name, applicant_email, status')
      .eq('course_id', courseId)
      .eq('status', 'admitted')
      .order('applicant_name', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const admitted = enrollments ?? []
    const userIds = admitted.map((e) => e.user_id).filter(Boolean) as string[]
    const progressMap = await queryCourseProgressForStudents(courseId, userIds)

    const now = Date.now()
    const INACTIVE_DAYS = 7

    const rows = admitted.map((e) => {
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
      return {
        enrollmentId: e.id,
        userId: uid,
        name: e.applicant_name,
        email: e.applicant_email,
        status: e.status,
        progressPercent: percent,
        completedLessons: progress?.completed ?? 0,
        totalLessons: progress?.total ?? 0,
        lastActivityAt,
        daysSinceActivity,
        atRisk,
      }
    })

    const { count: lessonCount } = await supabaseAdmin
      .from('course_content')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId)

    return NextResponse.json({
      lessonCount: lessonCount ?? 0,
      students: rows,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load progress'
    const status = message === 'Unauthorized' || message.includes('access') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
