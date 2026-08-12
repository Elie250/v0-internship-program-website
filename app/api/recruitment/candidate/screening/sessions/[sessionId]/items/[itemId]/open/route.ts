import { NextResponse } from 'next/server'
import { getRecruitmentSessionUser } from '@/lib/recruitment/authz'
import { openSessionItem } from '@/lib/recruitment/screening-sessions'

export async function POST(
  _request: Request,
  context: { params: Promise<{ sessionId: string; itemId: string }> }
) {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { sessionId, itemId } = await context.params
    const result = await openSessionItem({
      sessionId,
      itemId,
      candidateUserId: user.id,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Could not open question' }, { status: 500 })
  }
}
