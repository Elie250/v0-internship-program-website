import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import {
  EMPLOYER_PIPELINE_STATUSES,
  isRecruitmentApplicationStatus,
  type RecruitmentApplicationStatus,
} from '@/lib/recruitment/types'

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
}

export async function listOrganizationApplications(input: {
  organizationId: string
  jobId?: string
  status?: string
}): Promise<{ applications: EmployerApplicationRow[]; error?: string }> {
  if (!supabaseAdmin) return { applications: [], error: 'Database not configured' }

  const { data: jobs, error: jobsError } = await supabaseAdmin
    .from('recruitment_jobs')
    .select('id')
    .eq('organization_id', input.organizationId)
  if (jobsError) return { applications: [], error: jobsError.message }
  const jobIds = (jobs ?? []).map((job) => job.id)
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
  return { applications: (data ?? []) as unknown as EmployerApplicationRow[] }
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
  actorUserId: string
}): Promise<{ application?: EmployerApplicationRow; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  if (!isRecruitmentApplicationStatus(input.status)) return { error: 'Invalid status' }
  if (input.status === 'withdrawn') {
    return { error: 'Candidates withdraw applications; employers cannot set withdrawn.' }
  }
  if (!EMPLOYER_PIPELINE_STATUSES.includes(input.status)) {
    return { error: 'Invalid pipeline status' }
  }

  const current = await getOrganizationApplication(input.applicationId, input.organizationId)
  if (current.error) return { error: current.error }
  if (!current.application) return { error: 'Application not found' }

  const fromStatus = current.application.status
  if (fromStatus === input.status) return { application: current.application }

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
      actor_user_id: input.actorUserId,
    },
  ])

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: 'application_status_changed',
    entityType: 'recruitment_applications',
    entityId: input.applicationId,
    metadata: { fromStatus, toStatus: input.status, jobId: current.application.job_id },
  })

  return { application: data as unknown as EmployerApplicationRow }
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

export async function getEmployerDashboardMetrics(organizationId: string) {
  if (!supabaseAdmin) {
    return {
      activeJobs: 0,
      applications: 0,
      underReview: 0,
      screeningsPending: 0,
      shortlisted: 0,
      error: 'Database not configured',
    }
  }

  const { data: jobs } = await supabaseAdmin
    .from('recruitment_jobs')
    .select('id')
    .eq('organization_id', organizationId)
  const jobIds = (jobs ?? []).map((job) => job.id)
  const { count: activeJobs } = await supabaseAdmin
    .from('recruitment_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'published')

  let rows: Array<{ status: string }> = []
  if (jobIds.length > 0) {
    const { data: apps } = await supabaseAdmin
      .from('recruitment_applications')
      .select('id, status')
      .in('job_id', jobIds)
    rows = apps ?? []
  }
  return {
    activeJobs: activeJobs ?? 0,
    applications: rows.length,
    underReview: rows.filter((row) => row.status === 'under_review').length,
    screeningsPending: rows.filter((row) => row.status === 'screening').length,
    shortlisted: rows.filter((row) => row.status === 'shortlisted').length,
  }
}
