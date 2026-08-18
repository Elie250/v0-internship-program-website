import { NextResponse } from 'next/server'
import { getRecruitmentSessionUser } from '@/lib/recruitment/authz'
import { listCandidateMessages } from '@/lib/recruitment/application-messages'

export async function GET() {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { messages, error } = await listCandidateMessages(user.id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ messages })
  } catch {
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
  }
}
