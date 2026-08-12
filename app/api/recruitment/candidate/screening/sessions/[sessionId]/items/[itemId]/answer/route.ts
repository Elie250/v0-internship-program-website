import { NextResponse } from 'next/server'
import { getRecruitmentSessionUser } from '@/lib/recruitment/authz'
import { submitSessionAnswer } from '@/lib/recruitment/screening-sessions'

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string; itemId: string }> }
) {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { sessionId, itemId } = await context.params
    const body = await request.json()
    const answerPayload =
      body.answer && typeof body.answer === 'object' && !Array.isArray(body.answer)
        ? (body.answer as Record<string, unknown>)
        : (body as Record<string, unknown>)

    // Never trust client score / remaining time / ownership claims
    delete answerPayload.score
    delete answerPayload.points
    delete answerPayload.remainingTime

    const result = await submitSessionAnswer({
      sessionId,
      itemId,
      candidateUserId: user.id,
      answerPayload,
      clientEventAt: body.clientEventAt != null ? String(body.clientEventAt) : null,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Could not save answer' }, { status: 500 })
  }
}
