import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { submitAssessmentAttempt } from '@/lib/learning/assessment-integrity'

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await sessionUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: assessmentId } = await params
  const body = await request.json()
  const attemptId = String(body.attemptId ?? '')
  const rawAnswers = body.answers

  if (!attemptId) {
    return NextResponse.json({ error: 'A valid attempt session is required' }, { status: 400 })
  }

  if (!rawAnswers || typeof rawAnswers !== 'object') {
    return NextResponse.json({ error: 'Answers required' }, { status: 400 })
  }

  const answers: Record<string, number> = {}
  for (const [questionId, value] of Object.entries(rawAnswers as Record<string, unknown>)) {
    const idx = Number(value)
    if (Number.isInteger(idx) && idx >= 0) answers[questionId] = idx
  }

  const result = await submitAssessmentAttempt({
    attemptId,
    userId: user.id,
    answers,
  })

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

  return NextResponse.json({
    assessmentId,
    score: result.score,
    passed: result.passed,
    correctCount: result.correctCount,
    totalQuestions: result.totalQuestions,
    attemptCount: result.attemptCount,
    revealAnswers: result.revealAnswers,
    results: result.results,
    integrityFlags: result.integrityFlags,
  })
}
