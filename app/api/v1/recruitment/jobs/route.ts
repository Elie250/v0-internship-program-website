import { NextResponse } from 'next/server'
import {
  apiError,
  credentialCanAccessJob,
  finishApiRequest,
  requireExternalApiAuth,
} from '@/lib/recruitment/api-auth'
import {
  createOrganizationJob,
  getOrganizationJob,
  listOrganizationJobs,
  updateOrganizationJob,
} from '@/lib/recruitment/jobs'
import { serializeExternalJob } from '@/lib/recruitment/api-serializers'

function parseLimitOffset(url: URL) {
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)))
  const offset = Math.max(0, Number(url.searchParams.get('offset') || 0))
  return { limit, offset }
}

export async function GET(request: Request) {
  const authResult = await requireExternalApiAuth(request, ['jobs:read'])
  if (authResult instanceof NextResponse) return authResult
  const { auth } = authResult

  const { jobs, error } = await listOrganizationJobs(auth.organizationId, {
    jobIds: auth.accessMode === 'restricted' ? auth.jobIds ?? [] : null,
  })
  if (error) {
    return finishApiRequest(authResult, request, apiError(500, 'server_error', error, authResult.requestId))
  }

  const { limit, offset } = parseLimitOffset(new URL(request.url))
  const page = jobs.slice(offset, offset + limit).map((job) =>
    serializeExternalJob(job as unknown as Record<string, unknown>)
  )
  return finishApiRequest(
    authResult,
    request,
    NextResponse.json({
      data: page,
      pagination: { limit, offset, total: jobs.length },
      request_id: authResult.requestId,
    })
  )
}

export async function POST(request: Request) {
  const authResult = await requireExternalApiAuth(request, ['jobs:write'])
  if (authResult instanceof NextResponse) return authResult
  if (authResult.auth.accessMode === 'restricted') {
    return finishApiRequest(
      authResult,
      request,
      apiError(
        403,
        'forbidden',
        'Restricted credentials cannot create jobs.',
        authResult.requestId
      ),
      { errorCode: 'forbidden' }
    )
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  // Ignore client organization_id
  delete body.organization_id
  delete body.organizationId

  const result = await createOrganizationJob({
    organizationId: authResult.auth.organizationId,
    title: String(body.title ?? ''),
    slug: body.slug != null ? String(body.slug) : undefined,
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
    status: body.status as never,
    visibility: body.visibility != null ? String(body.visibility) : undefined,
    applicationDeadline:
      body.application_deadline != null ? String(body.application_deadline) : null,
    actorUserId: null,
  })

  if (result.error || !result.job) {
    return finishApiRequest(
      authResult,
      request,
      apiError(400, 'validation_error', result.error || 'Create failed', authResult.requestId),
      { errorCode: 'validation_error' }
    )
  }

  return finishApiRequest(
    authResult,
    request,
    NextResponse.json(
      {
        data: serializeExternalJob(result.job as unknown as Record<string, unknown>),
        request_id: authResult.requestId,
      },
      { status: 201 }
    ),
    { resourceType: 'job', resourceId: result.job.id }
  )
}
