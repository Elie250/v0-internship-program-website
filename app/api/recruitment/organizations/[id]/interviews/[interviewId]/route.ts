import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { INTERVIEW_MANAGE_ROLES } from '@/lib/recruitment/rbac'
import {
  getOrganizationInterview,
  listInterviewEvaluations,
  updateInterview,
} from '@/lib/recruitment/interviews'
import { notifyInterviewEvent } from '@/lib/recruitment/recruitment-notifications'
import { getOrganizationById } from '@/lib/recruitment/organizations'
import { getOrganizationApplication } from '@/lib/recruitment/employer-applications'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { assertCanAccessInterview } from '@/lib/recruitment/job-assignments'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; interviewId: string }> }
) {
  try {
    const { id: organizationId, interviewId } = await context.params
    const access = await requireOrganizationAccess(organizationId, INTERVIEW_MANAGE_ROLES)
    await assertCanAccessInterview({ access, organizationId, interviewId })
    const [{ interview, error }, { evaluations }] = await Promise.all([
      getOrganizationInterview(organizationId, interviewId),
      listInterviewEvaluations(organizationId, interviewId),
    ])
    if (error) return NextResponse.json({ error }, { status: 500 })
    if (!interview) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ interview, evaluations })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; interviewId: string }> }
) {
  try {
    const { id: organizationId, interviewId } = await context.params
    const access = await requireOrganizationAccess(organizationId, INTERVIEW_MANAGE_ROLES)
    await assertCanAccessInterview({ access, organizationId, interviewId })
    const body = await request.json()
    const result = await updateInterview({
      organizationId,
      interviewId,
      actorUserId: access.user.id,
      interviewType: body.interviewType != null ? String(body.interviewType) : undefined,
      scheduledAt: body.scheduledAt != null ? String(body.scheduledAt) : undefined,
      durationMinutes: body.durationMinutes != null ? Number(body.durationMinutes) : undefined,
      timezone:
        body.timezone !== undefined
          ? body.timezone != null
            ? String(body.timezone)
            : null
          : undefined,
      location:
        body.location !== undefined
          ? body.location != null
            ? String(body.location)
            : null
          : undefined,
      meetingUrl:
        body.meetingUrl !== undefined
          ? body.meetingUrl != null
            ? String(body.meetingUrl)
            : null
          : undefined,
      candidateInstructions:
        body.candidateInstructions !== undefined
          ? body.candidateInstructions != null
            ? String(body.candidateInstructions)
            : null
          : undefined,
      internalNotes:
        body.internalNotes !== undefined
          ? body.internalNotes != null
            ? String(body.internalNotes)
            : null
          : undefined,
      status: body.status != null ? String(body.status) : undefined,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })

    const interview = result.interview!
    const { application } = await getOrganizationApplication(
      interview.application_id,
      organizationId
    )
    if (application && (result.rescheduled || body.status === 'cancelled')) {
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
          eventType: result.rescheduled ? 'interview_rescheduled' : 'interview_cancelled',
          scheduledAt: interview.scheduled_at,
          interviewType: interview.interview_type,
          location: interview.location,
          meetingUrl: interview.meeting_url,
          candidateInstructions: interview.candidate_instructions,
        })
      }
    }

    return NextResponse.json({ interview })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
