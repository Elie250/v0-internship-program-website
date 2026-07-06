import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import { queryCourseProgressForStudents } from '@/lib/learning/lesson-progress'
import { queryCourseQuizStandings } from '@/lib/learning/quiz'

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

    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .maybeSingle()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from('course_enrollments')
      .select(
        'id, user_id, applicant_name, applicant_email, applicant_phone, status, amount_due, admitted_at, access_starts_at, access_ends_at, created_at'
      )
      .eq('course_id', courseId)
      .order('applicant_name', { ascending: true })

    if (enrollError) return NextResponse.json({ error: enrollError.message }, { status: 500 })

    const rows = enrollments ?? []
    const admitted = rows.filter((r) => r.status === 'admitted')
    const userIds = admitted.map((e) => e.user_id).filter(Boolean) as string[]

    const [progressMap, quizResult, lessonCountRes] = await Promise.all([
      queryCourseProgressForStudents(courseId, userIds),
      queryCourseQuizStandings(courseId),
      supabaseAdmin
        .from('course_content')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', courseId),
    ])

    const standingsByEnrollment = new Map(
      quizResult.standings.map((s) => [s.enrollmentId, s])
    )

    const learningStatus = admitted.map((e) => {
      const uid = e.user_id as string | null
      const progress = uid ? progressMap.get(uid) : undefined
      const standing = standingsByEnrollment.get(e.id)
      return {
        enrollmentId: e.id,
        name: e.applicant_name,
        email: e.applicant_email,
        phone: e.applicant_phone ?? null,
        status: e.status,
        admittedAt: e.admitted_at ?? null,
        completedLessons: progress?.completed ?? 0,
        totalLessons: progress?.total ?? lessonCountRes.count ?? 0,
        progressPercent: progress?.percent ?? 0,
        quizzesCompleted: standing?.completedQuizzes ?? 0,
        totalQuizzes: standing?.totalQuizzes ?? 0,
        averageScore: standing?.averageScore ?? null,
        certificateStatus: standing?.certificateStatus ?? null,
        certificateCode: standing?.certificateCode ?? null,
        eligible: standing?.eligible ?? false,
      }
    })

    const quizTitles = quizResult.standings[0]?.submissions.map((s) => ({
      id: s.assessmentId,
      title: s.assessmentTitle,
    })) ?? []

    const marksheet = quizResult.standings.map((s) => ({
      enrollmentId: s.enrollmentId,
      name: s.name,
      email: s.email,
      scores: s.submissions.map((sub) => ({
        assessmentId: sub.assessmentId,
        assessmentTitle: sub.assessmentTitle,
        score: sub.score,
        passed: sub.passed,
        attemptCount: sub.attemptCount,
      })),
      averageScore: s.averageScore,
      eligible: s.eligible,
      certificateCode: s.certificateCode,
      certificateStatus: s.certificateStatus,
    }))

    const enrollmentRoster = rows.map((e) => ({
      id: e.id,
      name: e.applicant_name,
      email: e.applicant_email,
      phone: e.applicant_phone ?? null,
      status: e.status,
      amountDue: Number(e.amount_due ?? 0),
      enrolledAt: e.created_at,
      admittedAt: e.admitted_at ?? null,
      accessStartsAt: e.access_starts_at ?? null,
      accessEndsAt: e.access_ends_at ?? null,
    }))

    const avgProgress =
      learningStatus.length > 0
        ? Math.round(
            learningStatus.reduce((sum, s) => sum + s.progressPercent, 0) / learningStatus.length
          )
        : 0

    const summary = {
      totalEnrollments: rows.length,
      admitted: admitted.length,
      pending: rows.filter((r) =>
        ['payment_pending_review', 'waitlisted'].includes(String(r.status))
      ).length,
      rejected: rows.filter((r) => r.status === 'payment_rejected').length,
      lessonCount: lessonCountRes.count ?? 0,
      quizCount: quizTitles.length,
      passingScore: quizResult.passingScore,
      avgProgress,
      certified: quizResult.standings.filter((s) => s.certificateStatus === 'issued').length,
      pendingCertification: quizResult.standings.filter(
        (s) => s.certificateStatus === 'pending_admin'
      ).length,
      eligibleForCertification: quizResult.standings.filter((s) => s.eligible && !s.certificateCode)
        .length,
    }

    return NextResponse.json({
      courseTitle: course.title,
      generatedAt: new Date().toISOString(),
      summary,
      quizTitles,
      learningStatus,
      marksheet,
      enrollmentRoster,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load reports'
    const status = message === 'Unauthorized' || message.includes('access') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
