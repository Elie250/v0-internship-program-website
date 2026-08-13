import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import { isJobAcceptingApplications } from '@/lib/recruitment/jobs'
import {
  ACTIVE_APPLICATION_STATUSES,
  WITHDRAWABLE_APPLICATION_STATUSES,
  isRecruitmentApplicationStatus,
  type RecruitmentApplication,
  type RecruitmentApplicationStatus,
  type RecruitmentApplicationWithJob,
  type RecruitmentCandidateProfile,
} from '@/lib/recruitment/types'

const APPLICATION_SELECT =
  'id, job_id, candidate_user_id, status, cv_document_id, profile_snapshot, submitted_at, created_at, updated_at'

const APPLICATION_WITH_JOB_SELECT = `
  ${APPLICATION_SELECT},
  job:recruitment_jobs(
    id, title, slug, status, location, employment_type, work_mode, application_deadline,
    organization:recruitment_organizations(name, slug, logo_url, status)
  )
`

export type ApplicationProfileSnapshot = {
  headline: string | null
  phone: string | null
  location: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  github_url: string | null
  summary: string | null
  skills: string[]
  education: unknown[]
  experience: unknown[]
  full_name: string | null
  email: string | null
}

export type SubmitApplicationResult = {
  application?: RecruitmentApplication
  organizationName?: string
  jobTitle?: string
  organizationNotificationEmail?: string | null
  error?: string
}

export function buildProfileSnapshot(input: {
  profile: RecruitmentCandidateProfile
  email: string
  firstName?: string
  lastName?: string
}): ApplicationProfileSnapshot {
  const fullName = [input.firstName?.trim(), input.lastName?.trim()].filter(Boolean).join(' ') || null
  return {
    headline: input.profile.headline,
    phone: input.profile.phone,
    location: input.profile.location,
    linkedin_url: input.profile.linkedin_url,
    portfolio_url: input.profile.portfolio_url,
    github_url: input.profile.github_url,
    summary: input.profile.summary,
    skills: input.profile.skills ?? [],
    education: input.profile.education ?? [],
    experience: input.profile.experience ?? [],
    full_name: fullName,
    email: input.email,
  }
}

export async function listCandidateApplications(candidateUserId: string): Promise<{
  applications: RecruitmentApplicationWithJob[]
  error?: string
}> {
  if (!supabaseAdmin) return { applications: [], error: 'Database not configured' }

  const nested = await supabaseAdmin
    .from('recruitment_applications')
    .select(APPLICATION_WITH_JOB_SELECT)
    .eq('candidate_user_id', candidateUserId)
    .order('submitted_at', { ascending: false })

  if (!nested.error) {
    return {
      applications: normalizeApplicationRows(nested.data ?? []),
    }
  }

  // Fallback if nested job/org embed fails (schema cache / relationship issues).
  const flat = await supabaseAdmin
    .from('recruitment_applications')
    .select(APPLICATION_SELECT)
    .eq('candidate_user_id', candidateUserId)
    .order('submitted_at', { ascending: false })

  if (flat.error) {
    return {
      applications: [],
      error: nested.error.message || flat.error.message,
    }
  }

  const rows = (flat.data ?? []) as RecruitmentApplication[]
  if (rows.length === 0) return { applications: [] }

  const jobIds = [...new Set(rows.map((row) => row.job_id).filter(Boolean))]
  const { data: jobs, error: jobsError } = await supabaseAdmin
    .from('recruitment_jobs')
    .select(
      'id, title, slug, status, location, employment_type, work_mode, application_deadline, organization:recruitment_organizations(name, slug, logo_url, status)'
    )
    .in('id', jobIds)

  if (jobsError) {
    // Still return applications without job titles rather than an empty dashboard.
    return {
      applications: rows.map((row) => ({ ...row, job: null })) as RecruitmentApplicationWithJob[],
      error: undefined,
    }
  }

  const jobById = new Map(
    (jobs ?? []).map((job) => {
      const orgRaw = Array.isArray(job.organization) ? job.organization[0] : job.organization
      return [
        String(job.id),
        {
          ...job,
          organization: orgRaw ?? null,
        },
      ] as const
    })
  )

  return {
    applications: rows.map((row) => ({
      ...row,
      job: jobById.get(row.job_id) ?? null,
    })) as unknown as RecruitmentApplicationWithJob[],
  }
}

function normalizeApplicationRows(rows: unknown[]): RecruitmentApplicationWithJob[] {
  return rows.map((raw) => {
    const row = raw as RecruitmentApplicationWithJob & {
      job?: RecruitmentApplicationWithJob['job'] | RecruitmentApplicationWithJob['job'][] | null
    }
    const jobRaw = Array.isArray(row.job) ? row.job[0] : row.job
    if (!jobRaw) return { ...row, job: null }
    const orgRaw = Array.isArray(jobRaw.organization)
      ? jobRaw.organization[0]
      : jobRaw.organization
    return {
      ...row,
      job: {
        ...jobRaw,
        organization: orgRaw ?? null,
      },
    }
  })
}

export async function getCandidateApplication(
  applicationId: string,
  candidateUserId: string
): Promise<{ application: RecruitmentApplicationWithJob | null; error?: string }> {
  if (!supabaseAdmin) return { application: null, error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('recruitment_applications')
    .select(APPLICATION_WITH_JOB_SELECT)
    .eq('id', applicationId)
    .eq('candidate_user_id', candidateUserId)
    .maybeSingle()

  if (error) return { application: null, error: error.message }
  if (!data) return { application: null }
  return { application: normalizeApplicationRows([data])[0] ?? null }
}

export async function getActiveApplicationForJob(
  jobId: string,
  candidateUserId: string
): Promise<{ application: RecruitmentApplication | null; error?: string }> {
  if (!supabaseAdmin) return { application: null, error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('recruitment_applications')
    .select(APPLICATION_SELECT)
    .eq('job_id', jobId)
    .eq('candidate_user_id', candidateUserId)
    .in('status', ACTIVE_APPLICATION_STATUSES)
    .maybeSingle()

  if (error) return { application: null, error: error.message }
  return { application: (data as RecruitmentApplication | null) ?? null }
}

export async function submitApplication(input: {
  jobId: string
  candidateUserId: string
  cvDocumentId: string
  profileSnapshot: ApplicationProfileSnapshot
  actorUserId: string
}): Promise<SubmitApplicationResult> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { data: job, error: jobError } = await supabaseAdmin
    .from('recruitment_jobs')
    .select(
      'id, title, status, application_deadline, organization:recruitment_organizations(id, status, name, notification_email)'
    )
    .eq('id', input.jobId)
    .maybeSingle()

  if (jobError) return { error: jobError.message }
  if (!job) return { error: 'Job not found' }

  const org = Array.isArray(job.organization) ? job.organization[0] : job.organization
  if (!org || org.status !== 'active') {
    return { error: 'This employer is not currently accepting applications.' }
  }
  if (!isJobAcceptingApplications(job)) {
    return { error: 'This job is not currently accepting applications.' }
  }

  const { data: cvDoc, error: cvError } = await supabaseAdmin
    .from('recruitment_documents')
    .select('id, candidate_user_id, document_type, deleted_at')
    .eq('id', input.cvDocumentId)
    .eq('candidate_user_id', input.candidateUserId)
    .is('deleted_at', null)
    .maybeSingle()

  if (cvError) return { error: cvError.message }
  if (!cvDoc || cvDoc.document_type !== 'cv') {
    return { error: 'A valid CV is required to apply.' }
  }

  const existing = await getActiveApplicationForJob(input.jobId, input.candidateUserId)
  if (existing.application) {
    return { error: 'You have already applied to this job.' }
  }

  const submittedAt = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from('recruitment_applications')
    .insert([
      {
        job_id: input.jobId,
        candidate_user_id: input.candidateUserId,
        status: 'submitted',
        cv_document_id: input.cvDocumentId,
        profile_snapshot: input.profileSnapshot,
        submitted_at: submittedAt,
      },
    ])
    .select(APPLICATION_SELECT)
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'You have already applied to this job.' }
    }
    return { error: error.message }
  }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: org.id,
    action: 'application_submitted',
    entityType: 'recruitment_applications',
    entityId: data.id,
    metadata: { jobId: input.jobId, cvDocumentId: input.cvDocumentId },
  })

  return {
    application: data as RecruitmentApplication,
    organizationName: org.name,
    jobTitle: job.title,
    organizationNotificationEmail: org.notification_email,
  }
}

export async function withdrawApplication(input: {
  applicationId: string
  candidateUserId: string
  actorUserId: string
}): Promise<{ application?: RecruitmentApplication; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('recruitment_applications')
    .select(`${APPLICATION_SELECT}, job:recruitment_jobs(organization_id)`)
    .eq('id', input.applicationId)
    .eq('candidate_user_id', input.candidateUserId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!existing) return { error: 'Application not found' }

  const status = existing.status as RecruitmentApplicationStatus
  if (!WITHDRAWABLE_APPLICATION_STATUSES.includes(status)) {
    return { error: 'This application can no longer be withdrawn.' }
  }

  const { data, error } = await supabaseAdmin
    .from('recruitment_applications')
    .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
    .eq('id', input.applicationId)
    .eq('candidate_user_id', input.candidateUserId)
    .select(APPLICATION_SELECT)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Withdrawal failed' }

  const job = Array.isArray(existing.job) ? existing.job[0] : existing.job
  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: job?.organization_id ?? null,
    action: 'application_withdrawn',
    entityType: 'recruitment_applications',
    entityId: data.id,
    metadata: { previousStatus: status },
  })

  return { application: data as RecruitmentApplication }
}
