import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import { queryCourseProgressForStudents } from '@/lib/learning/lesson-progress'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await context.params
    await requireLecturerCourseAccess(courseId)

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const enrollmentId = searchParams.get('enrollmentId')

    if (enrollmentId) {
      const { data: enrollment, error: enrollError } = await supabaseAdmin
        .from('course_enrollments')
        .select('id, user_id, course_id, status')
        .eq('id', enrollmentId)
        .eq('course_id', courseId)
        .maybeSingle()

      if (enrollError) return NextResponse.json({ error: enrollError.message }, { status: 500 })
      if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })

      const { data: contentRows, error: contentError } = await supabaseAdmin
        .from('course_content')
        .select('id, title, sort_order')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true })

      if (contentError) return NextResponse.json({ error: contentError.message }, { status: 500 })

      const userId = enrollment.user_id as string | null
      let progressByContent = new Map<string, { completed: boolean; lastOpenedAt: string | null }>()

      if (userId) {
        const { data: progressRows, error: progressError } = await supabaseAdmin
          .from('lesson_progress')
          .select('content_id, completed_at, last_opened_at')
          .eq('course_id', courseId)
          .eq('user_id', userId)

        if (progressError && !progressError.message.includes('does not exist')) {
          return NextResponse.json({ error: progressError.message }, { status: 500 })
        }

        for (const row of progressRows ?? []) {
          progressByContent.set(String(row.content_id), {
            completed: Boolean(row.completed_at),
            lastOpenedAt: (row.last_opened_at as string | null) ?? null,
          })
        }
      }

      const lessons = (contentRows ?? []).map((row) => {
        const progress = progressByContent.get(String(row.id))
        return {
          contentId: row.id,
          title: (row.title as string) || 'Untitled lesson',
          sortOrder: (row.sort_order as number) ?? 0,
          completed: progress?.completed ?? false,
          lastOpenedAt: progress?.lastOpenedAt ?? null,
        }
      })

      return NextResponse.json({ lessons })
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
