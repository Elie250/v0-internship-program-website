import { NextResponse } from 'next/server'
import {
  apiError,
  credentialCanAccessJob,
  finishApiRequest,
  requireExternalApiAuth,
} from '@/lib/recruitment/api-auth'
import { createInterview, listOrganizationInterviews } from '@/lib/recruitment/interviews'
import { getOrganizationApplication } from '@/lib/recruitment/employer-applications'
import { serializeExternalInterview } from '@/lib/recruitment/api-serializers'
import { hasScope } from '@/lib/recruitment/api-scopes'
import { createEventId, enqueueWebhookEvent } from '@/lib/recruitment/api-webhooks'

function parseLimitOffset(url: URL) {
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)))
  const offset = Math.max(0, Number(url.searchParams.get('offset') || 0))
  return { limit, offset }
}

export async function GET(request: Request) {
  const authResult = await requireExternalApiAuth(request, ['interviews:read'])
  if (authResult instanceof NextResponse) return authResult
  const url = new URL(request.url)
  const jobId = url.searchParams.get('job_id') || undefined
  const applicationId = url.searchParams.get('application_id') || undefined

  if (jobId && !credentialCanAccessJob(authResult.auth, jobId)) {
    return finishApiRequest(
      authResult,
      request,
      apiError(403, 'forbidden', 'Job not in credential allow-list.', authResult.requestId),
      { errorCode: 'forbidden' }
    )
  }

  const { interviews, error } = await listOrganizationInterviews({
    organizationId: authResult.auth.organizationId,
    jobId,
    applicationId,
    jobIds: authResult.auth.accessMode === 'restricted' ? authResult.auth.jobIds ?? [] : null,
  })
  if (error) {
    return finishApiRequest(
      authResult,
      request,
      apiError(500, 'server_error', error, authResult.requestId)
    )
  }

  const includeInternal = hasScope(authResult.auth.scopes, 'notes:read')
  const { limit, offset } = parseLimitOffset(url)
  const page = interviews.slice(offset, offset + limit).map((row) => {
    const base = serializeExternalInterview(row as unknown as Record<string, unknown>)
    if (includeInternal) {
      return {
        ...base,
        internal_notes: (row as { internal_notes?: string | null }).internal_notes ?? null,
      }
    }
    return base
  })

  return finishApiRequest(
    authResult,
    request,
    NextResponse.json({
      data: page,
      pagination: { limit, offset, total: interviews.length },
      request_id: authResult.requestId,
    })
  )
}

export async function POST(request: Request) {
  const authResult = await requireExternalApiAuth(request, ['interviews:write'])
  if (authResult instanceof NextResponse) return authResult

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const applicationId = String(body.application_id ?? body.applicationId ?? '')
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

  const result = await createInterview({
    organizationId: authResult.auth.organizationId,
    applicationId,
    actorUserId: null,
    interviewType: String(body.interview_type ?? body.interviewType ?? 'online'),
    scheduledAt: String(body.scheduled_at ?? body.scheduledAt ?? ''),
    durationMinutes: body.duration_minutes != null ? Number(body.duration_minutes) : 60,
    timezone: body.timezone != null ? String(body.timezone) : null,
    location: body.location != null ? String(body.location) : null,
    meetingUrl: body.meeting_url != null ? String(body.meeting_url) : null,
    candidateInstructions:
      body.candidate_instructions != null ? String(body.candidate_instructions) : null,
    internalNotes: body.internal_notes != null ? String(body.internal_notes) : null,
  })

  if (result.error || !result.interview) {
    return finishApiRequest(
      authResult,
      request,
      apiError(400, 'validation_error', result.error || 'Create failed', authResult.requestId),
      { errorCode: 'validation_error' }
    )
  }

  void enqueueWebhookEvent({
    organizationId: authResult.auth.organizationId,
    eventType: 'interview.created',
    eventId: createEventId('interview.created', result.interview.id),
    data: {
      interview_id: result.interview.id,
      application_id: result.interview.application_id,
      job_id: result.interview.job_id,
      scheduled_at: result.interview.scheduled_at,
    },
  })

  return finishApiRequest(
    authResult,
    request,
    NextResponse.json(
      {
        data: serializeExternalInterview(result.interview as unknown as Record<string, unknown>),
        request_id: authResult.requestId,
      },
      { status: 201 }
    ),
    { resourceType: 'interview', resourceId: result.interview.id }
  )
}
