import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { queryCourseQuizzes } from '@/lib/learning/quiz'

async function sessionUser() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string; role: string }
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const user = await sessionUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const courseId = String(searchParams.get('courseId') ?? '')
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

  const { data: enrollment } = await supabaseAdmin
    .from('course_enrollments')
    .select('id, status')
    .eq('course_id', courseId)
    .eq('user_id', user.id)
    .eq('status', 'admitted')
    .maybeSingle()

  if (!enrollment) {
    return NextResponse.json({ error: 'You are not admitted to this programme' }, { status: 403 })
  }

  const { quizzes, error } = await queryCourseQuizzes(courseId, {
    includeAnswers: false,
    publishedOnly: true,
  })
  if (error) return NextResponse.json({ error }, { status: 500 })

  const withQuestions = quizzes.filter((q) => q.questions.length > 0)

  let submissions: Array<Record<string, unknown>> = []
  if (withQuestions.length) {
    const { data } = await supabaseAdmin
      .from('assessment_submissions')
      .select('assessment_id, score, passed, attempt_count, correct_count, total_questions, submitted_at')
      .eq('enrollment_id', enrollment.id)
      .in('assessment_id', withQuestions.map((q) => q.id))
    submissions = data ?? []
  }

  const { data: certificate } = await supabaseAdmin
    .from('student_certificates')
    .select('*')
    .eq('enrollment_id', enrollment.id)
    .maybeSingle()

  const subByQuiz = new Map(submissions.map((s) => [String(s.assessment_id), s]))

  const payload = withQuestions.map((quiz) => {
    const sub = subByQuiz.get(quiz.id)
    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      passing_score: quiz.passing_score,
      questionCount: quiz.questions.length,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
      })),
      mySubmission: sub
        ? {
            score: Number(sub.score),
            passed: Boolean(sub.passed),
            attemptCount: Number(sub.attempt_count ?? 1),
            correctCount: sub.correct_count != null ? Number(sub.correct_count) : null,
            totalQuestions: sub.total_questions != null ? Number(sub.total_questions) : null,
            submittedAt: (sub.submitted_at as string | null) ?? null,
          }
        : null,
    }
  })

  const taken = payload.filter((q) => q.mySubmission)
  const averageScore = taken.length
    ? Math.round(taken.reduce((sum, q) => sum + Number(q.mySubmission!.score), 0) / taken.length)
    : null

  return NextResponse.json({
    quizzes: payload,
    averageScore,
    completedQuizzes: taken.length,
    totalQuizzes: payload.length,
    certificate: certificate
      ? {
          code: certificate.certificate_code,
          issuedAt: certificate.issued_at,
          status: ((certificate.status as string | null) ?? 'issued'),
        }
      : null,
  })
}
