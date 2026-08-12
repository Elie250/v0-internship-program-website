import { NextResponse } from 'next/server'
import { getRecruitmentSessionUser } from '@/lib/recruitment/authz'
import { listCandidateInterviews } from '@/lib/recruitment/interviews'

export async function GET() {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { interviews, error } = await listCandidateInterviews(user.id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ interviews })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
