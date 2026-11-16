import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { queryCourseQuizzes } from '@/lib/learning/quiz'
import { getAssessmentAccessSummary } from '@/lib/learning/assessment-integrity'
import {
  getStudentPracticalSubmission,
  listPracticalAssessments,
} from '@/lib/learning/practical-assessment-service'

async function sessionUser() {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string }
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const user = await sessionUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const courseId = String(new URL(request.url).searchParams.get('courseId') ?? '')
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

  const { data: enrollment } = await supabaseAdmin
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', user.id)
    .eq('status', 'admitted')
    .maybeSingle()

  if (!enrollment) return NextResponse.json({ error: 'Not admitted' }, { status: 403 })

  const { quizzes, error: quizError } = await queryCourseQuizzes(courseId, {
    includeAnswers: false,
    publishedOnly: true,
  })
  if (quizError) return NextResponse.json({ error: quizError }, { status: 500 })

  const withQuestions = quizzes.filter((q) => q.questions.length > 0)
  const { data: quizSubs } = await supabaseAdmin
    .from('assessment_submissions')
    .select(
      'assessment_id, score, passed, attempt_count, correct_count, total_questions, submitted_at, locked_at, best_score'
    )
    .eq('enrollment_id', enrollment.id)
    .in(
      'assessment_id',
      withQuestions.map((q) => q.id).concat(['00000000-0000-0000-0000-000000000000'])
    )

  const subByQuiz = new Map((quizSubs ?? []).map((s) => [String(s.assessment_id), s]))

  const quizItems = await Promise.all(
    withQuestions.map(async (quiz) => {
      const sub = subByQuiz.get(quiz.id)
      const access = await getAssessmentAccessSummary(quiz.id, user.id)
      return {
        id: quiz.id,
        kind: 'quiz' as const,
        title: quiz.title,
        description: quiz.description,
        passing_score: quiz.passing_score,
        questionCount: quiz.questions.length,
        mySubmission: sub
          ? {
              score: Number(sub.best_score ?? sub.score),
              passed: Boolean(sub.passed),
              attemptCount: Number(sub.attempt_count ?? 0),
              submittedAt: sub.submitted_at,
              locked: Boolean(sub.locked_at),
            }
          : null,
        security: access,
      }
    })
  )

  const { assessments: practicals, error: practicalError } = await listPracticalAssessments(courseId, {
    publishedOnly: true,
  })
  if (practicalError) {
    // Schema not applied yet — still return quizzes
    return NextResponse.json({
      quizzes: quizItems,
      practicals: [],
      warning: practicalError,
    })
  }

  const practicalItems = []
  for (const assessment of practicals) {
    const { submission } = await getStudentPracticalSubmission({
      assessmentId: assessment.id,
      enrollmentId: enrollment.id,
    })
    const showScores =
      submission?.practical_status === 'graded' || submission?.practical_status === 'returned'
    practicalItems.push({
      id: assessment.id,
      kind: assessment.assessment_kind,
      kind_label: assessment.kind_label,
      title: assessment.title,
      description: assessment.description,
      passing_score: assessment.passing_score,
      due_at: assessment.due_at,
      delivery_mode: assessment.delivery_mode,
      mySubmission: {
        status: submission?.practical_status ?? null,
        score: showScores ? submission?.score ?? null : null,
        passed: showScores ? Boolean(submission?.passed) : false,
        feedback_summary: showScores ? submission?.feedback_summary ?? null : null,
        submitted_at: submission?.submitted_at ?? null,
        artifactCount: submission?.artifacts.length ?? 0,
      },
    })
  }

  return NextResponse.json({
    quizzes: quizItems,
    practicals: practicalItems,
  })
}
