import { NextResponse } from 'next/server'
import { getRecruitmentSessionUser } from '@/lib/recruitment/authz'
import { startScreeningSession } from '@/lib/recruitment/screening-sessions'

export async function POST(request: Request) {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const applicationId = String(body.applicationId ?? '')
    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId required' }, { status: 400 })
    }
    const result = await startScreeningSession({
      applicationId,
      candidateUserId: user.id,
      consentAcknowledged: Boolean(body.consentAcknowledged),
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({
      sessionId: result.session?.id,
      resumed: Boolean(result.resumed),
      expiresAt: result.session?.expires_at,
      startedAt: result.session?.started_at,
    })
  } catch {
    return NextResponse.json({ error: 'Could not start screening' }, { status: 500 })
  }
}
