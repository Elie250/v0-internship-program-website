import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { submitAssessmentScore } from '@/lib/learning/completion'

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

export async function POST(request: Request) {
  const user = await sessionUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const enrollmentId = String(body.enrollmentId ?? '')
  const score = Number(body.score)

  if (!enrollmentId || Number.isNaN(score)) {
    return NextResponse.json({ error: 'Enrollment and score required' }, { status: 400 })
  }

  const result = await submitAssessmentScore({
    enrollmentId,
    userId: user.id,
    score,
  })

  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ passed: result.passed })
}
