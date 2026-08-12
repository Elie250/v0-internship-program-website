/**
 * Hiring-manager job assignment scoping.
 * Org Admin / HR / Platform Admin: organization-wide.
 * Hiring Manager: only explicitly assigned jobs (server-resolved).
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { RecruitmentOrgRole } from '@/lib/recruitment/types'
import type { RecruitmentSessionUser } from '@/lib/recruitment/authz'
import { getOrganizationApplication } from '@/lib/recruitment/employer-applications'
import { getOrganizationInterview } from '@/lib/recruitment/interviews'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'

export type OrgAccessContext = {
  user: RecruitmentSessionUser
  membership: { id: string; role: RecruitmentOrgRole; organization_id: string } | null
  asPlatformAdmin: boolean
}

export type JobAccessScope =
  | { mode: 'all' }
  | { mode: 'assigned'; jobIds: string[] }
  | { mode: 'none' }

/** Pure: org-wide recruitment visibility (not assignment-scoped). */
export function roleHasOrgWideJobAccess(
  asPlatformAdmin: boolean,
  role: RecruitmentOrgRole | null | undefined
): boolean {
  if (asPlatformAdmin) return true
  return role === 'organization_admin' || role === 'hr_recruiter'
}

/** Pure: HM must be assignment-scoped. */
export function roleRequiresJobAssignment(
  asPlatformAdmin: boolean,
  role: RecruitmentOrgRole | null | undefined
): boolean {
  return !asPlatformAdmin && role === 'hiring_manager'
}

/**
 * Pure access check given a resolved assignment set.
 * assignedJobIds is ignored when the role has org-wide access.
 */
export function canAccessJobWithAssignments(input: {
  asPlatformAdmin: boolean
  role: RecruitmentOrgRole | null | undefined
  jobId: string
  assignedJobIds: readonly string[]
}): boolean {
  if (roleHasOrgWideJobAccess(input.asPlatformAdmin, input.role)) return true
  if (!roleRequiresJobAssignment(input.asPlatformAdmin, input.role)) {
    // Unknown / missing role: deny
    return false
  }
  return input.assignedJobIds.includes(input.jobId)
}

/** Pure list filter — never leaks unassigned jobs. */
export function filterJobsByAssignmentScope<T extends { id: string }>(
  jobs: T[],
  scope: JobAccessScope
): T[] {
  if (scope.mode === 'all') return jobs
  if (scope.mode === 'none') return []
  const allowed = new Set(scope.jobIds)
  return jobs.filter((job) => allowed.has(job.id))
}

export function filterRowsByJobIdScope<T extends { job_id?: string; jobId?: string }>(
  rows: T[],
  scope: JobAccessScope
): T[] {
  if (scope.mode === 'all') return rows
  if (scope.mode === 'none') return []
  const allowed = new Set(scope.jobIds)
  return rows.filter((row) => {
    const jobId = row.job_id ?? row.jobId
    return Boolean(jobId && allowed.has(jobId))
  })
}

export async function listAssignedJobIds(
  organizationId: string,
  userId: string
): Promise<string[]> {
  if (!supabaseAdmin) return []
  const { data, error } = await supabaseAdmin
    .from('recruitment_job_assignments')
    .select('job_id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
  if (error) return []
  return (data ?? []).map((row) => String(row.job_id))
}

export async function resolveJobAccessScope(
  access: OrgAccessContext,
  organizationId: string
): Promise<JobAccessScope> {
  if (roleHasOrgWideJobAccess(access.asPlatformAdmin, access.membership?.role)) {
    return { mode: 'all' }
  }
  if (!roleRequiresJobAssignment(access.asPlatformAdmin, access.membership?.role)) {
    return { mode: 'none' }
  }
  const jobIds = await listAssignedJobIds(organizationId, access.user.id)
  if (jobIds.length === 0) return { mode: 'none' }
  return { mode: 'assigned', jobIds }
}

/**
 * Resolve optional list filter for HM vs org-wide.
 * Explicit jobId outside scope → Forbidden (IDOR prevention).
 */
export async function resolveScopedJobIds(input: {
  access: OrgAccessContext
  organizationId: string
  requestedJobId?: string | null
}): Promise<{ jobIds: string[] | null; error?: string }> {
  const scope = await resolveJobAccessScope(input.access, input.organizationId)
  const requested = input.requestedJobId?.trim() || null

  if (scope.mode === 'all') {
    return { jobIds: requested ? [requested] : null }
  }
  if (scope.mode === 'none') {
    if (requested) return { jobIds: [], error: 'Forbidden' }
    return { jobIds: [] }
  }

  if (requested) {
    if (!scope.jobIds.includes(requested)) return { jobIds: [], error: 'Forbidden' }
    return { jobIds: [requested] }
  }
  return { jobIds: scope.jobIds }
}

export async function assertCanAccessJob(input: {
  access: OrgAccessContext
  organizationId: string
  jobId: string
}): Promise<void> {
  if (!input.jobId) throw new Error('Forbidden')
  // Confirm job belongs to org (never trust client job_id alone)
  if (!supabaseAdmin) throw new Error('Database not configured')
  const { data: job } = await supabaseAdmin
    .from('recruitment_jobs')
    .select('id, organization_id')
    .eq('id', input.jobId)
    .eq('organization_id', input.organizationId)
    .maybeSingle()
  if (!job) throw new Error('Forbidden')

  if (roleHasOrgWideJobAccess(input.access.asPlatformAdmin, input.access.membership?.role)) {
    return
  }

  const assigned = await listAssignedJobIds(input.organizationId, input.access.user.id)
  if (
    !canAccessJobWithAssignments({
      asPlatformAdmin: input.access.asPlatformAdmin,
      role: input.access.membership?.role,
      jobId: input.jobId,
      assignedJobIds: assigned,
    })
  ) {
    throw new Error('Forbidden')
  }
}

export async function assertCanAccessApplication(input: {
  access: OrgAccessContext
  organizationId: string
  applicationId: string
}): Promise<{ jobId: string }> {
  const { application, error } = await getOrganizationApplication(
    input.applicationId,
    input.organizationId
  )
  if (error) throw new Error(error)
  if (!application) throw new Error('Forbidden')
  await assertCanAccessJob({
    access: input.access,
    organizationId: input.organizationId,
    jobId: application.job_id,
  })
  return { jobId: application.job_id }
}

export async function assertCanAccessScreeningSession(input: {
  access: OrgAccessContext
  organizationId: string
  sessionId: string
}): Promise<{ jobId: string }> {
  if (!supabaseAdmin) throw new Error('Database not configured')
  const { data: session } = await supabaseAdmin
    .from('recruitment_screening_sessions')
    .select('id, job_id, organization_id')
    .eq('id', input.sessionId)
    .eq('organization_id', input.organizationId)
    .maybeSingle()
  if (!session) throw new Error('Forbidden')
  await assertCanAccessJob({
    access: input.access,
    organizationId: input.organizationId,
    jobId: String(session.job_id),
  })
  return { jobId: String(session.job_id) }
}

export async function assertCanAccessInterview(input: {
  access: OrgAccessContext
  organizationId: string
  interviewId: string
}): Promise<{ jobId: string }> {
  const { interview, error } = await getOrganizationInterview(
    input.organizationId,
    input.interviewId
  )
  if (error) throw new Error(error)
  if (!interview) throw new Error('Forbidden')
  await assertCanAccessJob({
    access: input.access,
    organizationId: input.organizationId,
    jobId: interview.job_id,
  })
  return { jobId: interview.job_id }
}

export async function listJobAssignments(organizationId: string, jobId: string) {
  if (!supabaseAdmin) return { assignments: [], error: 'Database not configured' }
  const { data: job } = await supabaseAdmin
    .from('recruitment_jobs')
    .select('id')
    .eq('id', jobId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (!job) return { assignments: [], error: 'Job not found' }

  const { data, error } = await supabaseAdmin
    .from('recruitment_job_assignments')
    .select('id, job_id, organization_id, user_id, created_at')
    .eq('organization_id', organizationId)
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
  if (error) return { assignments: [], error: error.message }
  return { assignments: data ?? [] }
}

export async function assignHiringManagerToJob(input: {
  organizationId: string
  jobId: string
  userId: string
  actorUserId: string
}) {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { data: job } = await supabaseAdmin
    .from('recruitment_jobs')
    .select('id')
    .eq('id', input.jobId)
    .eq('organization_id', input.organizationId)
    .maybeSingle()
  if (!job) return { error: 'Job not found' }

  const { data: membership } = await supabaseAdmin
    .from('recruitment_organization_memberships')
    .select('id, role, status')
    .eq('organization_id', input.organizationId)
    .eq('user_id', input.userId)
    .eq('status', 'active')
    .maybeSingle()
  if (!membership) return { error: 'User is not an active organization member' }
  if (membership.role !== 'hiring_manager') {
    return { error: 'Only hiring_manager members can be assigned to jobs' }
  }

  const { data, error } = await supabaseAdmin
    .from('recruitment_job_assignments')
    .upsert(
      [
        {
          organization_id: input.organizationId,
          job_id: input.jobId,
          user_id: input.userId,
        },
      ],
      { onConflict: 'job_id,user_id' }
    )
    .select('id, job_id, organization_id, user_id, created_at')
    .single()

  if (error) return { error: error.message }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: 'job_assignment_created',
    entityType: 'recruitment_job_assignments',
    entityId: data.id,
    metadata: { jobId: input.jobId, assignedUserId: input.userId },
  })

  return { assignment: data }
}

export async function unassignHiringManagerFromJob(input: {
  organizationId: string
  jobId: string
  userId: string
  actorUserId: string
}) {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { data: existing } = await supabaseAdmin
    .from('recruitment_job_assignments')
    .select('id')
    .eq('organization_id', input.organizationId)
    .eq('job_id', input.jobId)
    .eq('user_id', input.userId)
    .maybeSingle()
  if (!existing) return { error: 'Assignment not found' }

  const { error } = await supabaseAdmin
    .from('recruitment_job_assignments')
    .delete()
    .eq('id', existing.id)
    .eq('organization_id', input.organizationId)

  if (error) return { error: error.message }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: 'job_assignment_removed',
    entityType: 'recruitment_job_assignments',
    entityId: existing.id,
    metadata: { jobId: input.jobId, assignedUserId: input.userId },
  })

  return { ok: true }
}

/** Candidate isolation invariant helper for tests / docs. */
export function candidateMayBypassJobAssignment(): boolean {
  return false
}
