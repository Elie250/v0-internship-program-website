import { NextResponse } from 'next/server'
import { getRecruitmentSessionUser } from '@/lib/recruitment/authz'
import { getCandidateSessionView } from '@/lib/recruitment/screening-sessions'

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { sessionId } = await context.params
    const result = await getCandidateSessionView(sessionId, user.id)
    if (result.error) return NextResponse.json({ error: result.error }, { status: 404 })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Could not load session' }, { status: 500 })
  }
}
