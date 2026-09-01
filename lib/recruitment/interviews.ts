/**
 * Interview workflow — employer-managed, never auto-hires.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import { getOrganizationApplication } from '@/lib/recruitment/employer-applications'
import { DEFAULT_INTERVIEW_CRITERIA } from '@/lib/recruitment/interview-constants'
import {
  identityFromSnapshotAndUser,
  loadUsersByIds,
} from '@/lib/recruitment/candidate-identity'
import { parseInterviewDateTime } from '@/lib/recruitment/interview-format'

export { DEFAULT_INTERVIEW_CRITERIA } from '@/lib/recruitment/interview-constants'

export type InterviewType = 'in_person' | 'online' | 'phone'
export type InterviewStatus = 'scheduled' | 'rescheduled' | 'completed' | 'cancelled' | 'no_show'

export type InterviewCandidateFields = {
  candidate_name: string
  candidate_email: string
  job_title: string
}

const INTERVIEW_SELECT =
  'id, organization_id, job_id, application_id, candidate_user_id, interview_type, status, scheduled_at, duration_minutes, timezone, location, meeting_url, candidate_instructions, internal_notes, created_by, cancelled_at, completed_at, created_at, updated_at'

function isInterviewType(value: string): value is InterviewType {
  return value === 'in_person' || value === 'online' || value === 'phone'
}

function isInterviewStatus(value: string): value is InterviewStatus {
  return (
    value === 'scheduled' ||
    value === 'rescheduled' ||
    value === 'completed' ||
    value === 'cancelled' ||
    value === 'no_show'
  )
}

export async function listOrganizationInterviews(input: {
  organizationId: string
  jobId?: string
  /** Restrict to these jobs (HM scope). Empty = none. null/undefined = all org. */
  jobIds?: string[] | null
  applicationId?: string
  upcomingOnly?: boolean
}) {
  if (!supabaseAdmin) return { interviews: [], error: 'Database not configured' }
  if (input.jobIds && input.jobIds.length === 0) return { interviews: [] }

  let query = supabaseAdmin
    .from('recruitment_interviews')
    .select(INTERVIEW_SELECT)
    .eq('organization_id', input.organizationId)
    .order('scheduled_at', { ascending: true })

  if (input.jobId) query = query.eq('job_id', input.jobId)
  else if (input.jobIds && input.jobIds.length > 0) query = query.in('job_id', input.jobIds)
  if (input.applicationId) query = query.eq('application_id', input.applicationId)
  if (input.upcomingOnly) {
    query = query
      .gte('scheduled_at', new Date().toISOString())
      .in('status', ['scheduled', 'rescheduled'])
  }

  const { data, error } = await query
  if (error) return { interviews: [], error: error.message }
  return { interviews: await attachInterviewPeople(data ?? []) }
}

async function attachInterviewPeople<T extends { application_id?: string; candidate_user_id?: string }>(
  interviews: T[]
): Promise<Array<T & InterviewCandidateFields>> {
  if (interviews.length === 0) return []

  const applicationIds = Array.from(
    new Set(interviews.map((row) => String(row.application_id || '').trim()).filter(Boolean))
  )
  const snapshotByApp = new Map<string, Record<string, unknown>>()
  const jobTitleByApp = new Map<string, string>()
  const userIdByApp = new Map<string, string>()

  if (supabaseAdmin && applicationIds.length > 0) {
    const { data: applications } = await supabaseAdmin
      .from('recruitment_applications')
      .select('id, candidate_user_id, profile_snapshot, job:recruitment_jobs(title)')
      .in('id', applicationIds)
    for (const row of applications ?? []) {
      snapshotByApp.set(String(row.id), (row.profile_snapshot ?? {}) as Record<string, unknown>)
      userIdByApp.set(String(row.id), String(row.candidate_user_id || ''))
      const job = Array.isArray(row.job) ? row.job[0] : row.job
      jobTitleByApp.set(String(row.id), String(job?.title || 'Role'))
    }
  }

  const userIds = interviews
    .map((row) => userIdByApp.get(String(row.application_id)) || String(row.candidate_user_id || ''))
    .filter(Boolean)
  const users = await loadUsersByIds(userIds)

  return interviews.map((row) => {
    const applicationId = String(row.application_id || '')
    const userId = userIdByApp.get(applicationId) || String(row.candidate_user_id || '')
    const identity = identityFromSnapshotAndUser(snapshotByApp.get(applicationId), users.get(userId))
    return {
      ...row,
      candidate_name: identity.name,
      candidate_email: identity.email,
      job_title: jobTitleByApp.get(applicationId) || 'Role',
    }
  })
}

export async function getOrganizationInterview(organizationId: string, interviewId: string) {
  if (!supabaseAdmin) return { interview: null, error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_interviews')
    .select(INTERVIEW_SELECT)
    .eq('id', interviewId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (error) return { interview: null, error: error.message }
  if (!data) return { interview: null }
  const [interview] = await attachInterviewPeople([data])
  return { interview }
}

export async function createInterview(input: {
  organizationId: string
  applicationId: string
  actorUserId?: string | null
  interviewType: string
  scheduledAt: string
  durationMinutes?: number
  timezone?: string | null
  location?: string | null
  meetingUrl?: string | null
  candidateInstructions?: string | null
  internalNotes?: string | null
}) {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  if (!isInterviewType(input.interviewType)) return { error: 'Invalid interview type' }
  const scheduled = parseInterviewDateTime(input.scheduledAt, input.timezone)
  if (Number.isNaN(scheduled.getTime())) return { error: 'Invalid interview date/time' }

  const { application, error } = await getOrganizationApplication(
    input.applicationId,
    input.organizationId
  )
  if (error) return { error }
  if (!application) return { error: 'Application not found' }
  if (application.status === 'withdrawn') {
    return { error: 'Cannot schedule interview for a withdrawn application' }
  }

  const job = Array.isArray(application.job) ? application.job[0] : application.job
  const now = new Date().toISOString()
  const { data, error: insertError } = await supabaseAdmin
    .from('recruitment_interviews')
    .insert([
      {
        organization_id: input.organizationId,
        job_id: application.job_id,
        application_id: input.applicationId,
        candidate_user_id: application.candidate_user_id,
        interview_type: input.interviewType,
        status: 'scheduled',
        scheduled_at: scheduled.toISOString(),
        duration_minutes: input.durationMinutes && input.durationMinutes > 0 ? input.durationMinutes : 60,
        timezone: input.timezone?.trim() || null,
        location: input.location?.trim() || null,
        meeting_url: input.meetingUrl?.trim() || null,
        candidate_instructions: input.candidateInstructions?.trim() || null,
        internal_notes: input.internalNotes?.trim() || null,
        created_by: input.actorUserId || null,
        created_at: now,
        updated_at: now,
      },
    ])
    .select(INTERVIEW_SELECT)
    .single()

  if (insertError) return { error: insertError.message }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId || null,
    organizationId: input.organizationId,
    action: 'interview_created',
    entityType: 'recruitment_interviews',
    entityId: data.id,
    metadata: {
      applicationId: input.applicationId,
      jobId: application.job_id,
      scheduledAt: data.scheduled_at,
      interviewType: data.interview_type,
      jobTitle: job?.title,
    },
  })

  return { interview: data, application }
}

export async function updateInterview(input: {
  organizationId: string
  interviewId: string
  actorUserId: string
  interviewType?: string
  scheduledAt?: string
  durationMinutes?: number
  timezone?: string | null
  location?: string | null
  meetingUrl?: string | null
  candidateInstructions?: string | null
  internalNotes?: string | null
  status?: string
}) {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  const current = await getOrganizationInterview(input.organizationId, input.interviewId)
  if (current.error) return { error: current.error }
  if (!current.interview) return { error: 'Interview not found' }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  let rescheduled = false

  if (input.interviewType != null) {
    if (!isInterviewType(input.interviewType)) return { error: 'Invalid interview type' }
    updates.interview_type = input.interviewType
  }
  if (input.scheduledAt != null) {
    const timezone =
      input.timezone !== undefined ? input.timezone : current.interview.timezone
    const scheduled = parseInterviewDateTime(input.scheduledAt, timezone)
    if (Number.isNaN(scheduled.getTime())) return { error: 'Invalid interview date/time' }
    updates.scheduled_at = scheduled.toISOString()
    if (scheduled.toISOString() !== current.interview.scheduled_at) {
      rescheduled = true
      updates.status = 'rescheduled'
    }
  }
  if (input.durationMinutes != null) updates.duration_minutes = input.durationMinutes
  if (input.timezone !== undefined) updates.timezone = input.timezone?.trim() || null
  if (input.location !== undefined) updates.location = input.location?.trim() || null
  if (input.meetingUrl !== undefined) updates.meeting_url = input.meetingUrl?.trim() || null
  if (input.candidateInstructions !== undefined) {
    updates.candidate_instructions = input.candidateInstructions?.trim() || null
  }
  if (input.internalNotes !== undefined) {
    updates.internal_notes = input.internalNotes?.trim() || null
  }
  if (input.status != null) {
    if (!isInterviewStatus(input.status)) return { error: 'Invalid interview status' }
    updates.status = input.status
    if (input.status === 'cancelled') updates.cancelled_at = new Date().toISOString()
    if (input.status === 'completed') updates.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin
    .from('recruitment_interviews')
    .update(updates)
    .eq('id', input.interviewId)
    .eq('organization_id', input.organizationId)
    .select(INTERVIEW_SELECT)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Update failed' }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: rescheduled
      ? 'interview_rescheduled'
      : input.status === 'cancelled'
        ? 'interview_cancelled'
        : input.status === 'completed'
          ? 'interview_completed'
          : 'interview_updated',
    entityType: 'recruitment_interviews',
    entityId: input.interviewId,
    metadata: {
      fromStatus: current.interview.status,
      toStatus: data.status,
      scheduledAt: data.scheduled_at,
    },
  })

  return { interview: data, rescheduled }
}

export async function upsertInterviewEvaluation(input: {
  organizationId: string
  interviewId: string
  interviewerUserId: string
  criteriaScores?: Record<string, number>
  overallRating?: number | null
  recommendation?: string | null
  feedback?: string | null
  privateNotes?: string | null
  submit?: boolean
}) {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  const { interview } = await getOrganizationInterview(input.organizationId, input.interviewId)
  if (!interview) return { error: 'Interview not found' }

  const allowedRec = new Set(['strong_yes', 'yes', 'neutral', 'no', 'strong_no'])
  if (input.recommendation && !allowedRec.has(input.recommendation)) {
    return { error: 'Invalid recommendation' }
  }

  const criteria: Record<string, number> = {}
  if (input.criteriaScores && typeof input.criteriaScores === 'object') {
    for (const [key, value] of Object.entries(input.criteriaScores)) {
      const n = Number(value)
      if (!Number.isFinite(n) || n < 1 || n > 5) continue
      criteria[key.slice(0, 80)] = n
    }
  }

  const now = new Date().toISOString()
  const payload = {
    interview_id: input.interviewId,
    organization_id: input.organizationId,
    application_id: interview.application_id,
    interviewer_user_id: input.interviewerUserId,
    criteria_scores: criteria,
    overall_rating: input.overallRating ?? null,
    recommendation: input.recommendation || null,
    feedback: input.feedback?.trim() || null,
    private_notes: input.privateNotes?.trim() || null,
    status: input.submit ? 'submitted' : 'draft',
    submitted_at: input.submit ? now : null,
    updated_at: now,
  }

  const { data, error } = await supabaseAdmin
    .from('recruitment_interview_evaluations')
    .upsert([payload], { onConflict: 'interview_id,interviewer_user_id' })
    .select(
      'id, interview_id, organization_id, application_id, interviewer_user_id, criteria_scores, overall_rating, recommendation, feedback, private_notes, status, submitted_at, created_at, updated_at'
    )
    .single()

  if (error) return { error: error.message }

  await writeRecruitmentAudit({
    actorUserId: input.interviewerUserId,
    organizationId: input.organizationId,
    action: input.submit ? 'interview_evaluation_submitted' : 'interview_evaluation_saved',
    entityType: 'recruitment_interview_evaluations',
    entityId: data.id,
    metadata: {
      interviewId: input.interviewId,
      recommendation: data.recommendation,
      // Never auto-change application status
      autoStatusChange: false,
    },
  })

  return { evaluation: data }
}

export async function listInterviewEvaluations(organizationId: string, interviewId: string) {
  if (!supabaseAdmin) return { evaluations: [], error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_interview_evaluations')
    .select(
      'id, interview_id, interviewer_user_id, criteria_scores, overall_rating, recommendation, feedback, private_notes, status, submitted_at, created_at'
    )
    .eq('organization_id', organizationId)
    .eq('interview_id', interviewId)
    .order('created_at', { ascending: false })
  if (error) return { evaluations: [], error: error.message }
  return { evaluations: data ?? [] }
}

/** Candidate-safe interview fields (no internal notes / evaluations). */
export async function listCandidateInterviews(candidateUserId: string) {
  if (!supabaseAdmin) return { interviews: [], error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_interviews')
    .select(
      'id, application_id, job_id, interview_type, status, scheduled_at, duration_minutes, timezone, location, meeting_url, candidate_instructions, organization_id'
    )
    .eq('candidate_user_id', candidateUserId)
    .neq('status', 'cancelled')
    .order('scheduled_at', { ascending: true })
  if (error) return { interviews: [], error: error.message }
  return {
    interviews: (data ?? []).map((row) => ({
      id: row.id,
      applicationId: row.application_id,
      jobId: row.job_id,
      interviewType: row.interview_type,
      status: row.status,
      scheduledAt: row.scheduled_at,
      durationMinutes: row.duration_minutes,
      timezone: row.timezone,
      location: row.location,
      meetingUrl: row.meeting_url,
      candidateInstructions: row.candidate_instructions,
      // intentionally omit internal_notes and evaluations
    })),
  }
}
