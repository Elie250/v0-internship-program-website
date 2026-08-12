import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { INTERVIEW_MANAGE_ROLES } from '@/lib/recruitment/rbac'
import {
  createInterview,
  listOrganizationInterviews,
} from '@/lib/recruitment/interviews'
import { notifyInterviewEvent } from '@/lib/recruitment/recruitment-notifications'
import { getOrganizationById } from '@/lib/recruitment/organizations'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  assertCanAccessApplication,
  resolveScopedJobIds,
} from '@/lib/recruitment/job-assignments'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, INTERVIEW_MANAGE_ROLES)
    const { searchParams } = new URL(request.url)
    const requestedJobId = searchParams.get('jobId')
    const applicationId = searchParams.get('applicationId') || undefined

    // If filtering by application, enforce that application's job assignment
    if (applicationId) {
      await assertCanAccessApplication({ access, organizationId, applicationId })
    }

    const scoped = await resolveScopedJobIds({
      access,
      organizationId,
      requestedJobId,
    })
    if (scoped.error) return NextResponse.json({ error: scoped.error }, { status: 403 })

    const { interviews, error } = await listOrganizationInterviews({
      organizationId,
      jobIds: scoped.jobIds,
      applicationId,
      upcomingOnly: searchParams.get('upcoming') === '1',
    })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ interviews })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, INTERVIEW_MANAGE_ROLES)
    const body = await request.json()
    const applicationId = String(body.applicationId ?? '')
    await assertCanAccessApplication({ access, organizationId, applicationId })

    const result = await createInterview({
      organizationId,
      applicationId,
      actorUserId: access.user.id,
      interviewType: String(body.interviewType ?? 'online'),
      scheduledAt: String(body.scheduledAt ?? ''),
      durationMinutes: body.durationMinutes != null ? Number(body.durationMinutes) : 60,
      timezone: body.timezone != null ? String(body.timezone) : null,
      location: body.location != null ? String(body.location) : null,
      meetingUrl: body.meetingUrl != null ? String(body.meetingUrl) : null,
      candidateInstructions:
        body.candidateInstructions != null ? String(body.candidateInstructions) : null,
      internalNotes: body.internalNotes != null ? String(body.internalNotes) : null,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })

    const interview = result.interview!
    const application = result.application!
    const snapshot = (application.profile_snapshot ?? {}) as Record<string, unknown>
    let candidateEmail = String(snapshot.email || '').trim()
    if (!candidateEmail && supabaseAdmin) {
      const { data: userRow } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', application.candidate_user_id)
        .maybeSingle()
      candidateEmail = String(userRow?.email || '').trim()
    }
    const job = Array.isArray(application.job) ? application.job[0] : application.job
    const { organization } = await getOrganizationById(organizationId)
    if (candidateEmail && organization && job) {
      void notifyInterviewEvent({
        organizationId,
        applicationId: application.id,
        interviewId: interview.id,
        candidateUserId: application.candidate_user_id,
        candidateEmail,
        candidateName: String(snapshot.full_name || '') || null,
        jobTitle: job.title,
        organizationName: organization.name,
        eventType: 'interview_invitation',
        scheduledAt: interview.scheduled_at,
        interviewType: interview.interview_type,
        location: interview.location,
        meetingUrl: interview.meeting_url,
        candidateInstructions: interview.candidate_instructions,
      })
    }

    return NextResponse.json({ interview }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
