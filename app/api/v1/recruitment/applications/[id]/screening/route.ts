import { NextResponse } from 'next/server'
import {
  apiError,
  credentialCanAccessJob,
  finishApiRequest,
  requireExternalApiAuth,
} from '@/lib/recruitment/api-auth'
import { getOrganizationApplication } from '@/lib/recruitment/employer-applications'
import { getEmployerApplicationScreening } from '@/lib/recruitment/screening-sessions'
import { serializeExternalScreeningSession } from '@/lib/recruitment/api-serializers'
import { stripAnswerKeys } from '@/lib/recruitment/api-serializers'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireExternalApiAuth(request, ['screening:read'])
  if (authResult instanceof NextResponse) return authResult
  const { id: applicationId } = await context.params

  const { application } = await getOrganizationApplication(
    applicationId,
    authResult.auth.organizationId
  )
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

  const result = await getEmployerApplicationScreening(
    authResult.auth.organizationId,
    applicationId
  )
  if (result.error) {
    const status = result.error === 'Forbidden' ? 403 : 404
    return finishApiRequest(
      authResult,
      request,
      apiError(status, status === 403 ? 'forbidden' : 'not_found', result.error, authResult.requestId)
    )
  }

  const sessions = (result.sessions ?? []).map((s) =>
    stripAnswerKeys(
      serializeExternalScreeningSession(s as unknown as Record<string, unknown>) as Record<
        string,
        unknown
      >
    )
  )

  return finishApiRequest(
    authResult,
    request,
    NextResponse.json({
      data: {
        application_id: applicationId,
        sessions,
        // Explicit: no answer keys / expected answers
        answer_keys_included: false,
      },
      request_id: authResult.requestId,
    }),
    { resourceType: 'screening', resourceId: applicationId }
  )
}
