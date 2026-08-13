/**
 * Employer application listing, status pipeline, and dashboard metrics.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import {
  EMPLOYER_PIPELINE_STATUSES,
  isRecruitmentApplicationStatus,
  type RecruitmentApplicationStatus,
  type RecruitmentOrgRole,
} from '@/lib/recruitment/types'
import {
  canRoleSetStatus,
  isAllowedPipelineTransition,
} from '@/lib/recruitment/pipeline'
import { notifyApplicationStatusChanged } from '@/lib/recruitment/recruitment-notifications'
import { getOrganizationById } from '@/lib/recruitment/organizations'
import { createEventId, enqueueWebhookEvent } from '@/lib/recruitment/api-webhooks'

const EMPLOYER_APPLICATION_SELECT = `
  id, job_id, candidate_user_id, status, cv_document_id, profile_snapshot, submitted_at, created_at, updated_at,
  job:recruitment_jobs!inner(id, title, slug, organization_id, status)
`

export type EmployerApplicationRow = {
  id: string
  job_id: string
  candidate_user_id: string
  status: RecruitmentApplicationStatus
  cv_document_id: string | null
  profile_snapshot: Record<string, unknown>
  submitted_at: string
  created_at: string
  updated_at: string
  job?: { id: string; title: string; slug: string; organization_id: string; status: string } | null
  /** Latest screening session integrity band (advisory only). */
  latestIntegrityBand?: string | null
}

export async function listOrganizationApplications(input: {
  organizationId: string
  jobId?: string
  /** When set (including empty), restricts to these job IDs. null/undefined = all org jobs. */
  jobIds?: string[] | null
  status?: string
}): Promise<{ applications: EmployerApplicationRow[]; error?: string }> {
  if (!supabaseAdmin) return { applications: [], error: 'Database not configured' }

  if (input.jobIds && input.jobIds.length === 0) return { applications: [] }

  const { data: jobs, error: jobsError } = await supabaseAdmin
    .from('recruitment_jobs')
    .select('id')
    .eq('organization_id', input.organizationId)
  if (jobsError) return { applications: [], error: jobsError.message }
  let jobIds = (jobs ?? []).map((job) => job.id)
  if (input.jobIds) {
    const allowed = new Set(input.jobIds)
    jobIds = jobIds.filter((id) => allowed.has(id))
  }
  if (jobIds.length === 0) return { applications: [] }
  if (input.jobId && !jobIds.includes(input.jobId)) return { applications: [] }

  let query = supabaseAdmin
    .from('recruitment_applications')
    .select(EMPLOYER_APPLICATION_SELECT)
    .in('job_id', input.jobId ? [input.jobId] : jobIds)
    .order('submitted_at', { ascending: false })

  if (input.status && isRecruitmentApplicationStatus(input.status)) {
    query = query.eq('status', input.status)
  }

  const { data, error } = await query
  if (error) return { applications: [], error: error.message }
  const applications = (data ?? []) as unknown as EmployerApplicationRow[]
  if (applications.length === 0) return { applications }

  const applicationIds = applications.map((row) => row.id)
  const { data: sessions } = await supabaseAdmin
    .from('recruitment_screening_sessions')
    .select('application_id, integrity_band, submitted_at, finalized_at, started_at')
    .eq('organization_id', input.organizationId)
    .in('application_id', applicationIds)
    .order('started_at', { ascending: false })

  const latestBandByApp = new Map<string, string | null>()
  for (const session of sessions ?? []) {
    const appId = String(session.application_id)
    if (latestBandByApp.has(appId)) continue
    latestBandByApp.set(
      appId,
      session.integrity_band != null ? String(session.integrity_band) : null
    )
  }

  return {
    applications: applications.map((row) => ({
      ...row,
      latestIntegrityBand: latestBandByApp.get(row.id) ?? null,
    })),
  }
}

export async function getOrganizationApplication(
  applicationId: string,
  organizationId: string
): Promise<{ application: EmployerApplicationRow | null; error?: string }> {
  if (!supabaseAdmin) return { application: null, error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('recruitment_applications')
    .select(EMPLOYER_APPLICATION_SELECT)
    .eq('id', applicationId)
    .maybeSingle()

  if (error) return { application: null, error: error.message }
  const row = data as unknown as EmployerApplicationRow | null
  const job = Array.isArray(row?.job) ? row?.job[0] : row?.job
  if (!row || job?.organization_id !== organizationId) {
    return { application: null }
  }
  return { application: row }
}

export async function updateOrganizationApplicationStatus(input: {
  applicationId: string
  organizationId: string
  status: string
  actorUserId?: string | null
  asPlatformAdmin?: boolean
  membershipRole?: RecruitmentOrgRole | null
}): Promise<{ application?: EmployerApplicationRow; error?: string; warning?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  if (!isRecruitmentApplicationStatus(input.status)) return { error: 'Invalid status' }
  if (input.status === 'withdrawn') {
    return { error: 'Candidates withdraw applications; employers cannot set withdrawn.' }
  }
  if (!EMPLOYER_PIPELINE_STATUSES.includes(input.status)) {
    return { error: 'Invalid pipeline status' }
  }

  if (
    !canRoleSetStatus(
      Boolean(input.asPlatformAdmin),
      input.membershipRole,
      input.status
    )
  ) {
    return {
      error:
        'Your role cannot set this status. Offer, hire, and reject require HR or organization admin.',
    }
  }

  const current = await getOrganizationApplication(input.applicationId, input.organizationId)
  if (current.error) return { error: current.error }
  if (!current.application) return { error: 'Application not found' }

  const fromStatus = current.application.status
  if (fromStatus === input.status) return { application: current.application }

  const transition = isAllowedPipelineTransition(fromStatus, input.status)
  if (!transition.ok) return { error: transition.error }

  let warning: string | undefined
  if (input.status === 'screening') {
    const { getJobScreeningConfig } = await import('@/lib/recruitment/screening')
    const { listJobScreeningItems } = await import('@/lib/recruitment/screening')
    const { config } = await getJobScreeningConfig(
      current.application.job_id,
      input.organizationId
    )
    const { items } = await listJobScreeningItems(
      current.application.job_id,
      input.organizationId
    )
    if (!config || !config.enabled || config.status !== 'published') {
      warning =
        'Candidate invited, but the technical assessment is not published yet. Publish it under Screening so the candidate can start.'
    } else if (!items?.length) {
      warning =
        'Candidate invited, but this role has no assessment questions. Add questions under Screening before the candidate can start.'
    }
  }

  const { data, error } = await supabaseAdmin
    .from('recruitment_applications')
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq('id', input.applicationId)
    .select(EMPLOYER_APPLICATION_SELECT)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Update failed' }

  const job = Array.isArray(data.job) ? data.job[0] : data.job
  if (!job || job.organization_id !== input.organizationId) {
    return { error: 'Application not found' }
  }

  await supabaseAdmin.from('recruitment_application_status_history').insert([
    {
      application_id: input.applicationId,
      organization_id: input.organizationId,
      from_status: fromStatus,
      to_status: input.status,
      actor_user_id: input.actorUserId || null,
    },
  ])

  const action =
    input.status === 'shortlisted'
      ? 'candidate_shortlisted'
      : input.status === 'rejected'
        ? 'candidate_rejected'
        : input.status === 'hired'
          ? 'candidate_hired'
          : input.status === 'offer'
            ? 'decision_recorded'
            : 'application_status_changed'

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId || null,
    organizationId: input.organizationId,
    action,
    entityType: 'recruitment_applications',
    entityId: input.applicationId,
    metadata: {
      fromStatus,
      toStatus: input.status,
      jobId: current.application.job_id,
      previousValues: { status: fromStatus },
    },
  })

  // Notify candidate (non-blocking failures recorded as notification events)
  const snapshot = (current.application.profile_snapshot ?? {}) as Record<string, unknown>
  let candidateEmail = String(snapshot.email || '').trim()
  if (!candidateEmail && supabaseAdmin) {
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', current.application.candidate_user_id)
      .maybeSingle()
    candidateEmail = String(userRow?.email || '').trim()
  }
  const { organization } = await getOrganizationById(input.organizationId)
  if (candidateEmail && organization) {
    void notifyApplicationStatusChanged({
      organizationId: input.organizationId,
      applicationId: input.applicationId,
      candidateUserId: current.application.candidate_user_id,
      candidateEmail,
      candidateName: String(snapshot.full_name || '') || null,
      jobTitle: job.title,
      organizationName: organization.name,
      status: input.status as RecruitmentApplicationStatus,
    })
  }

  const webhookType =
    input.status === 'hired' ? 'candidate.hired' : 'application.status_changed'
  void enqueueWebhookEvent({
    organizationId: input.organizationId,
    eventType: webhookType,
    eventId: createEventId(webhookType, input.applicationId, Date.now()),
    data: {
      application_id: input.applicationId,
      job_id: current.application.job_id,
      status: input.status,
      previous_status: fromStatus,
    },
  })

  return { application: data as unknown as EmployerApplicationRow, warning }
}

export async function listApplicationStatusHistory(
  applicationId: string,
  organizationId: string
) {
  if (!supabaseAdmin) return { history: [], error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_application_status_history')
    .select('id, from_status, to_status, actor_user_id, created_at')
    .eq('application_id', applicationId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  if (error) return { history: [], error: error.message }
  return { history: data ?? [] }
}

export async function getEmployerDashboardMetrics(
  organizationId: string,
  options?: { jobIds?: string[] | null }
) {
  if (!supabaseAdmin) {
    return {
      activeJobs: 0,
      newApplications: 0,
      applications: 0,
      underReview: 0,
      screeningsPending: 0,
      screeningCompleted: 0,
      shortlisted: 0,
      interviewsUpcoming: 0,
      offers: 0,
      hires: 0,
      error: 'Database not configured',
    }
  }

  if (options?.jobIds && options.jobIds.length === 0) {
    return {
      activeJobs: 0,
      newApplications: 0,
      applications: 0,
      underReview: 0,
      screeningsPending: 0,
      screeningCompleted: 0,
      shortlisted: 0,
      interviewsUpcoming: 0,
      offers: 0,
      hires: 0,
    }
  }

  let jobsQuery = supabaseAdmin
    .from('recruitment_jobs')
    .select('id, status')
    .eq('organization_id', organizationId)
  if (options?.jobIds && options.jobIds.length > 0) {
    jobsQuery = jobsQuery.in('id', options.jobIds)
  }
  const { data: jobs } = await jobsQuery
  const jobIds = (jobs ?? []).map((job) => job.id)
  const activeJobs = (jobs ?? []).filter((job) => job.status === 'published').length

  let rows: Array<{ id: string; status: string }> = []
  if (jobIds.length > 0) {
    const { data: apps } = await supabaseAdmin
      .from('recruitment_applications')
      .select('id, status')
      .in('job_id', jobIds)
    rows = apps ?? []
  }

  let interviewsQuery = supabaseAdmin
    .from('recruitment_interviews')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .in('status', ['scheduled', 'rescheduled'])
    .gte('scheduled_at', new Date().toISOString())
  if (options?.jobIds && options.jobIds.length > 0) {
    interviewsQuery = interviewsQuery.in('job_id', options.jobIds)
  }
  const { count: interviewsUpcoming } = await interviewsQuery

  let screeningCompleted = 0
  if (rows.length > 0) {
    const appIds = rows.map((r) => r.id)
    const { data: sessions } = await supabaseAdmin
      .from('recruitment_screening_sessions')
      .select('application_id, status')
      .eq('organization_id', organizationId)
      .in('application_id', appIds)
      .in('status', ['submitted', 'expired'])
    const seen = new Set((sessions ?? []).map((s) => s.application_id))
    screeningCompleted = seen.size
  }

  return {
    activeJobs,
    newApplications: rows.filter((row) => row.status === 'submitted').length,
    applications: rows.length,
    underReview: rows.filter((row) => row.status === 'under_review').length,
    screeningsPending: rows.filter((row) => row.status === 'screening').length,
    screeningCompleted,
    shortlisted: rows.filter((row) => row.status === 'shortlisted').length,
    interviewsUpcoming: interviewsUpcoming ?? 0,
    offers: rows.filter((row) => row.status === 'offer').length,
    hires: rows.filter((row) => row.status === 'hired').length,
  }
}
