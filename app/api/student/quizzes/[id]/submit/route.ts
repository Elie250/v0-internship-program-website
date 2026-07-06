import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { gradeQuizSubmission } from '@/lib/learning/quiz'

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
  const rawAnswers = body.answers

  if (!rawAnswers || typeof rawAnswers !== 'object') {
    return NextResponse.json({ error: 'Answers required' }, { status: 400 })
  }

  const answers: Record<string, number> = {}
  for (const [questionId, value] of Object.entries(rawAnswers as Record<string, unknown>)) {
    const idx = Number(value)
    if (Number.isInteger(idx) && idx >= 0) answers[questionId] = idx
  }

  const result = await gradeQuizSubmission({
    assessmentId,
    userId: user.id,
    answers,
  })

  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json(result)
}
