import { NextResponse } from 'next/server'
import { getRecruitmentSessionUser } from '@/lib/recruitment/authz'
import {
  createCandidateDocumentDownloadUrl,
  listCandidateDocuments,
  softDeleteCandidateDocument,
  uploadCandidateCv,
} from '@/lib/recruitment/documents'

export async function GET() {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { documents, error } = await listCandidateDocuments(user.id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ documents })
  } catch {
    return NextResponse.json({ error: 'Failed to load documents' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadCandidateCv({
      candidateUserId: user.id,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      buffer,
      actorUserId: user.id,
    })

    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ document: result.document })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    if (!documentId) {
      return NextResponse.json({ error: 'documentId required' }, { status: 400 })
    }

    const result = await softDeleteCandidateDocument({
      documentId,
      candidateUserId: user.id,
      actorUserId: user.id,
    })

    if (!result.success) return NextResponse.json({ error: result.error ?? 'Delete failed' }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
