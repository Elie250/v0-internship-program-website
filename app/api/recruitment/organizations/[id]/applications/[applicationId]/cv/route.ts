import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { APPLICATION_REVIEW_ROLES } from '@/lib/recruitment/rbac'
import { getOrganizationApplication } from '@/lib/recruitment/employer-applications'
import { createEmployerDocumentDownloadUrl } from '@/lib/recruitment/documents'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const { id: organizationId, applicationId } = await context.params
    await requireOrganizationAccess(organizationId, APPLICATION_REVIEW_ROLES)
    const { application, error } = await getOrganizationApplication(applicationId, organizationId)
    if (error) return NextResponse.json({ error }, { status: 500 })
    if (!application?.cv_document_id) {
      return NextResponse.json({ error: 'No CV on this application' }, { status: 404 })
    }
    const result = await createEmployerDocumentDownloadUrl({
      documentId: application.cv_document_id,
      organizationId,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 403 })
    return NextResponse.json({ url: result.url, expiresInSeconds: 120 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
