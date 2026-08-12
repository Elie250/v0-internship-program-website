import { NextResponse } from 'next/server'
import { getRecruitmentSessionUser } from '@/lib/recruitment/authz'
import { submitScreeningSession } from '@/lib/recruitment/screening-sessions'

export async function POST(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { sessionId } = await context.params
    const result = await submitScreeningSession(sessionId, user.id)
    if ('error' in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    const session = 'session' in result ? result.session : null
    return NextResponse.json({
      session: {
        id: session && 'id' in session ? session.id : undefined,
        status: session && 'status' in session ? session.status : undefined,
        technicalScore: session && 'technical_score' in session ? session.technical_score : null,
        sectionScores: session && 'section_scores' in session ? session.section_scores : null,
        passed: session && 'passed' in session ? session.passed : null,
        completionState: session && 'completion_state' in session ? session.completion_state : null,
        submittedAt: session && 'submitted_at' in session ? session.submitted_at : null,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Could not submit screening' }, { status: 500 })
  }
}
