import { NextResponse } from 'next/server'
import { getRecruitmentSessionUser } from '@/lib/recruitment/authz'
import { createCandidateDocumentDownloadUrl } from '@/lib/recruitment/documents'

export async function GET(
  _request: Request,
  context: { params: Promise<{ documentId: string }> }
) {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { documentId } = await context.params
    const result = await createCandidateDocumentDownloadUrl({
      documentId,
      candidateUserId: user.id,
    })

    if (result.error || !result.url) {
      return NextResponse.json({ error: result.error ?? 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ url: result.url })
  } catch {
    return NextResponse.json({ error: 'Failed to create download link' }, { status: 500 })
  }
}
