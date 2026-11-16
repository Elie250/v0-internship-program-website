import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import { queryCourseProgressForStudents } from '@/lib/learning/lesson-progress'
import { queryCourseQuizStandings } from '@/lib/learning/quiz'
import { queryPublishedLessonIds } from '@/lib/learning/published-lessons'
import {
  listPracticalAssessments,
  listPracticalSubmissionsForCourse,
} from '@/lib/learning/practical-assessment-service'

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

    const [progressMap, quizResult, publishedLessonIds, practicalList, practicalSubs] =
      await Promise.all([
        queryCourseProgressForStudents(courseId, userIds),
        queryCourseQuizStandings(courseId),
        queryPublishedLessonIds(courseId),
        listPracticalAssessments(courseId, { publishedOnly: true }),
        listPracticalSubmissionsForCourse(courseId),
      ])
    const lessonCount = publishedLessonIds.length
    const practicalAssessments = practicalList.assessments ?? []
    const practicalByEnrollment = new Map<string, Array<{ assessmentId: string; title: string; score: number | null; passed: boolean; status: string | null }>>()
    for (const row of practicalSubs.rows ?? []) {
      const list = practicalByEnrollment.get(row.enrollment_id) ?? []
      list.push({
        assessmentId: row.assessment_id,
        title: row.assessment_title,
        score: row.score,
        passed: row.passed,
        status: row.practical_status,
      })
      practicalByEnrollment.set(row.enrollment_id, list)
    }

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
        totalLessons: progress?.total ?? lessonCount,
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

    const practicalTitles = practicalAssessments.map((a) => ({
      id: a.id,
      title: a.title,
      kind: a.assessment_kind,
    }))

    const marksheet = quizResult.standings.map((s) => {
      const practicalScores = practicalAssessments.map((assessment) => {
        const found = (practicalByEnrollment.get(s.enrollmentId) ?? []).find(
          (row) => row.assessmentId === assessment.id
        )
        return {
          assessmentId: assessment.id,
          assessmentTitle: assessment.title,
          kind: assessment.assessment_kind,
          score: found?.score ?? null,
          passed: found?.passed ?? false,
          status: found?.status ?? null,
        }
      })
      return {
        enrollmentId: s.enrollmentId,
        name: s.name,
        email: s.email,
        scores: s.submissions.map((sub) => ({
          assessmentId: sub.assessmentId,
          assessmentTitle: sub.assessmentTitle,
          kind: 'quiz' as const,
          score: sub.score,
          passed: sub.passed,
          attemptCount: sub.attemptCount,
        })),
        practicalScores,
        averageScore: s.averageScore,
        eligible: s.eligible,
        certificateCode: s.certificateCode,
        certificateStatus: s.certificateStatus,
      }
    })

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
      lessonCount,
      quizCount: quizTitles.length,
      practicalCount: practicalTitles.length,
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
      practicalTitles,
      learningStatus,
      marksheet,
      enrollmentRoster,
      practicalSchemaWarning: practicalList.error || practicalSubs.error || null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load reports'
    const status = message === 'Unauthorized' || message.includes('access') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
