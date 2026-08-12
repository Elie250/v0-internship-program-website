import { NextResponse } from 'next/server'
import {
  apiError,
  credentialCanAccessJob,
  finishApiRequest,
  requireExternalApiAuth,
} from '@/lib/recruitment/api-auth'
import {
  getOrganizationApplication,
  listOrganizationApplications,
  updateOrganizationApplicationStatus,
} from '@/lib/recruitment/employer-applications'
import { listApplicationNotes } from '@/lib/recruitment/application-notes'
import { serializeExternalApplication } from '@/lib/recruitment/api-serializers'
import { hasScope } from '@/lib/recruitment/api-scopes'
import {
  createEventId,
  enqueueWebhookEvent,
} from '@/lib/recruitment/api-webhooks'

function parseLimitOffset(url: URL) {
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)))
  const offset = Math.max(0, Number(url.searchParams.get('offset') || 0))
  return { limit, offset }
}

export async function GET(request: Request) {
  const authResult = await requireExternalApiAuth(request, ['applications:read'])
  if (authResult instanceof NextResponse) return authResult
  const url = new URL(request.url)
  const jobId = url.searchParams.get('job_id') || undefined

  if (jobId && !credentialCanAccessJob(authResult.auth, jobId)) {
    return finishApiRequest(
      authResult,
      request,
      apiError(403, 'forbidden', 'Job not in credential allow-list.', authResult.requestId),
      { errorCode: 'forbidden' }
    )
  }

  const { applications, error } = await listOrganizationApplications({
    organizationId: authResult.auth.organizationId,
    jobId,
    jobIds: authResult.auth.accessMode === 'restricted' ? authResult.auth.jobIds ?? [] : null,
    status: url.searchParams.get('status') || undefined,
  })
  if (error) {
    return finishApiRequest(
      authResult,
      request,
      apiError(500, 'server_error', error, authResult.requestId)
    )
  }

  const { limit, offset } = parseLimitOffset(url)
  const page = applications
    .slice(offset, offset + limit)
    .map((app) => serializeExternalApplication(app as unknown as Record<string, unknown>))

  return finishApiRequest(
    authResult,
    request,
    NextResponse.json({
      data: page,
      pagination: { limit, offset, total: applications.length },
      request_id: authResult.requestId,
    })
  )
}
