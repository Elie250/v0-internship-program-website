import { NextResponse } from 'next/server'
import {
  apiError,
  credentialCanAccessJob,
  finishApiRequest,
  requireExternalApiAuth,
} from '@/lib/recruitment/api-auth'
import {
  getOrganizationApplication,
  updateOrganizationApplicationStatus,
} from '@/lib/recruitment/employer-applications'
import { listApplicationNotes } from '@/lib/recruitment/application-notes'
import { serializeExternalApplication } from '@/lib/recruitment/api-serializers'
import { hasScope } from '@/lib/recruitment/api-scopes'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireExternalApiAuth(request, ['applications:read'])
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
  if (!application) {
    return finishApiRequest(
      authResult,
      request,
      apiError(404, 'not_found', 'Application not found.', authResult.requestId),
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

  const includeNotes = hasScope(authResult.auth.scopes, 'notes:read')
  let notes: unknown[] = []
  if (includeNotes) {
    const listed = await listApplicationNotes(applicationId, authResult.auth.organizationId)
    notes = listed.notes ?? []
  }

  return finishApiRequest(
    authResult,
    request,
    NextResponse.json({
      data: serializeExternalApplication(application as unknown as Record<string, unknown>, {
        includeNotes,
        notes,
      }),
      request_id: authResult.requestId,
    }),
    { resourceType: 'application', resourceId: applicationId }
  )
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireExternalApiAuth(request, ['applications:write'])
  if (authResult instanceof NextResponse) return authResult
  const { id: applicationId } = await context.params

  const current = await getOrganizationApplication(
    applicationId,
    authResult.auth.organizationId
  )
  if (!current.application) {
    return finishApiRequest(
      authResult,
      request,
      apiError(404, 'not_found', 'Application not found.', authResult.requestId),
      { errorCode: 'not_found' }
    )
  }
  if (!credentialCanAccessJob(authResult.auth, current.application.job_id)) {
    return finishApiRequest(
      authResult,
      request,
      apiError(403, 'forbidden', 'Application job not in credential allow-list.', authResult.requestId),
      { errorCode: 'forbidden' }
    )
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const status = String(body.status ?? '')
  const result = await updateOrganizationApplicationStatus({
    applicationId,
    organizationId: authResult.auth.organizationId,
    status,
    actorUserId: null,
    // Org-wide API credentials with applications:write act as HR writers
    asPlatformAdmin: false,
    membershipRole: 'hr_recruiter',
  })
  if (result.error || !result.application) {
    return finishApiRequest(
      authResult,
      request,
      apiError(400, 'validation_error', result.error || 'Update failed', authResult.requestId),
      { errorCode: 'validation_error' }
    )
  }

  return finishApiRequest(
    authResult,
    request,
    NextResponse.json({
      data: serializeExternalApplication(result.application as unknown as Record<string, unknown>),
      request_id: authResult.requestId,
    }),
    { resourceType: 'application', resourceId: applicationId }
  )
}
