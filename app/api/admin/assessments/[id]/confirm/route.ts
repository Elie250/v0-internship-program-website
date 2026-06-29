import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/actions/admin-context'
import { confirmAssessmentAndIssueCertificate } from '@/lib/learning/completion'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const result = await confirmAssessmentAndIssueCertificate({
    submissionId: id,
    adminUserId: session.user.id,
  })

  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ certificateCode: result.certificateCode })
}
