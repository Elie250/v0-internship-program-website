import { NextResponse } from 'next/server'
import {
  apiError,
  credentialCanAccessJob,
  finishApiRequest,
  requireExternalApiAuth,
} from '@/lib/recruitment/api-auth'
import { getOrganizationApplication } from '@/lib/recruitment/employer-applications'
import { createEmployerDocumentDownloadUrl } from '@/lib/recruitment/documents'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireExternalApiAuth(request, ['documents:read'])
  if (authResult instanceof NextResponse) return authResult
  const { id: applicationId } = await context.params

  const { application, error } = await getOrganizationApplication(
    applicationId,
    authResult.auth.organizationId
  )
  if (error) {
    return finishApiRequest(
      authResult,
      request,
      apiError(500, 'server_error', error, authResult.requestId)
    )
  }
  if (!application?.cv_document_id) {
    return finishApiRequest(
      authResult,
      request,
      apiError(404, 'not_found', 'No CV on this application.', authResult.requestId),
      { errorCode: 'not_found' }
    )
  }
  if (!credentialCanAccessJob(authResult.auth, application.job_id)) {
    return finishApiRequest(
      authResult,
      request,
      apiError(403, 'forbidden', 'Application job not in credential allow-list.', authResult.requestId),
      { errorCode: 'forbidden' }
    )
  }

  const result = await createEmployerDocumentDownloadUrl({
    documentId: application.cv_document_id,
    organizationId: authResult.auth.organizationId,
  })
  if (result.error || !result.url) {
    return finishApiRequest(
      authResult,
      request,
      apiError(403, 'forbidden', result.error || 'CV access denied', authResult.requestId),
      { errorCode: 'forbidden' }
    )
  }

  return finishApiRequest(
    authResult,
    request,
    NextResponse.json({
      data: {
        url: result.url,
        expires_in_seconds: 120,
        // Never a permanent public URL
      },
      request_id: authResult.requestId,
    }),
    { resourceType: 'document', resourceId: application.cv_document_id }
  )
}
