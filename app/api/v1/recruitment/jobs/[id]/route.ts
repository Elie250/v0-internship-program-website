import { NextResponse } from 'next/server'
import {
  apiError,
  credentialCanAccessJob,
  finishApiRequest,
  requireExternalApiAuth,
} from '@/lib/recruitment/api-auth'
import { getOrganizationJob, updateOrganizationJob } from '@/lib/recruitment/jobs'
import { serializeExternalJob } from '@/lib/recruitment/api-serializers'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireExternalApiAuth(request, ['jobs:read'])
  if (authResult instanceof NextResponse) return authResult
  const { id: jobId } = await context.params

  if (!credentialCanAccessJob(authResult.auth, jobId)) {
    return finishApiRequest(
      authResult,
      request,
      apiError(403, 'forbidden', 'Job not in credential allow-list.', authResult.requestId),
      { errorCode: 'forbidden' }
    )
  }

  const { job, error } = await getOrganizationJob(jobId, authResult.auth.organizationId)
  if (error) {
    return finishApiRequest(
      authResult,
      request,
      apiError(500, 'server_error', error, authResult.requestId)
    )
  }
  if (!job) {
    return finishApiRequest(
      authResult,
      request,
      apiError(404, 'not_found', 'Job not found.', authResult.requestId),
      { errorCode: 'not_found' }
    )
  }

  return finishApiRequest(
    authResult,
    request,
    NextResponse.json({
      data: serializeExternalJob(job as unknown as Record<string, unknown>),
      request_id: authResult.requestId,
    }),
    { resourceType: 'job', resourceId: jobId }
  )
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireExternalApiAuth(request, ['jobs:write'])
  if (authResult instanceof NextResponse) return authResult
  const { id: jobId } = await context.params

  if (!credentialCanAccessJob(authResult.auth, jobId)) {
    return finishApiRequest(
      authResult,
      request,
      apiError(403, 'forbidden', 'Job not in credential allow-list.', authResult.requestId),
      { errorCode: 'forbidden' }
    )
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  delete body.organization_id
  delete body.organizationId

  // Convenience: action=publish|close
  let status = body.status != null ? String(body.status) : undefined
  if (body.action === 'publish') status = 'published'
  if (body.action === 'close') status = 'closed'

  const result = await updateOrganizationJob({
    jobId,
    organizationId: authResult.auth.organizationId,
    title: body.title != null ? String(body.title) : undefined,
    description: body.description != null ? String(body.description) : undefined,
    responsibilities: body.responsibilities != null ? String(body.responsibilities) : undefined,
    requirements: body.requirements != null ? String(body.requirements) : undefined,
    qualifications: body.qualifications != null ? String(body.qualifications) : undefined,
    location: body.location != null ? String(body.location) : undefined,
    employmentType: body.employment_type != null ? String(body.employment_type) : undefined,
    workMode: body.work_mode != null ? String(body.work_mode) : undefined,
    category: body.category != null ? String(body.category) : undefined,
    department: body.department != null ? String(body.department) : undefined,
    skills: body.skills,
    status: status as never,
    visibility: body.visibility != null ? String(body.visibility) : undefined,
    applicationDeadline:
      body.application_deadline !== undefined
        ? body.application_deadline != null
          ? String(body.application_deadline)
          : null
        : undefined,
    actorUserId: null,
  })

  if (result.error || !result.job) {
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
      data: serializeExternalJob(result.job as unknown as Record<string, unknown>),
      request_id: authResult.requestId,
    }),
    { resourceType: 'job', resourceId: jobId }
  )
}
