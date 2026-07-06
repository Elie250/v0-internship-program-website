import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { startAssessmentAttempt } from '@/lib/learning/assessment-integrity'

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

/** Start a secured, timed assessment attempt. Questions are shuffled server-side. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await sessionUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: assessmentId } = await params
  const result = await startAssessmentAttempt(assessmentId, user.id)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    attemptId: result.attemptId,
    attemptNumber: result.attemptNumber,
    expiresAt: result.expiresAt,
    timeLimitMinutes: result.timeLimitMinutes,
    questions: result.questions,
  })
}
