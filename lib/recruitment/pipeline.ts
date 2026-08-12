/**
 * Server-side application pipeline transitions.
 * Employer cannot set withdrawn. Decisions (offer/hired/rejected) require decision roles.
 */

import type { RecruitmentApplicationStatus } from '@/lib/recruitment/types'
import type { RecruitmentOrgRole } from '@/lib/recruitment/types'

/** UI label "NEW" maps to submitted */
export const PIPELINE_UI_STATUSES = [
  'submitted',
  'under_review',
  'screening',
  'shortlisted',
  'interview',
  'offer',
  'hired',
  'rejected',
] as const

const TRANSITIONS: Record<string, RecruitmentApplicationStatus[]> = {
  submitted: ['under_review', 'screening', 'rejected'],
  under_review: ['screening', 'shortlisted', 'interview', 'rejected', 'submitted'],
  screening: ['under_review', 'shortlisted', 'interview', 'rejected'],
  shortlisted: ['interview', 'offer', 'under_review', 'rejected'],
  interview: ['shortlisted', 'offer', 'rejected', 'under_review'],
  offer: ['hired', 'interview', 'rejected'],
  hired: [],
  rejected: ['under_review', 'shortlisted'],
  withdrawn: [],
}

export const DECISION_STATUSES: RecruitmentApplicationStatus[] = ['offer', 'hired', 'rejected']

export const DECISION_ROLES: RecruitmentOrgRole[] = ['organization_admin', 'hr_recruiter']

export function isDecisionStatus(status: string): boolean {
  return DECISION_STATUSES.includes(status as RecruitmentApplicationStatus)
}

export function canRoleSetStatus(
  asPlatformAdmin: boolean,
  membershipRole: RecruitmentOrgRole | null | undefined,
  toStatus: string
): boolean {
  if (asPlatformAdmin) return true
  if (!membershipRole) return false
  if (isDecisionStatus(toStatus)) {
    return DECISION_ROLES.includes(membershipRole)
  }
  return (
    membershipRole === 'organization_admin' ||
    membershipRole === 'hr_recruiter' ||
    membershipRole === 'hiring_manager'
  )
}

export function isAllowedPipelineTransition(
  fromStatus: string,
  toStatus: string
): { ok: boolean; error?: string } {
  if (fromStatus === toStatus) return { ok: true }
  if (toStatus === 'withdrawn') {
    return { ok: false, error: 'Candidates withdraw applications; employers cannot set withdrawn.' }
  }
  if (fromStatus === 'withdrawn') {
    return { ok: false, error: 'Withdrawn applications cannot be moved by employers.' }
  }
  if (fromStatus === 'hired' && toStatus !== 'hired') {
    return { ok: false, error: 'Hired is a terminal status for this workflow.' }
  }
  const allowed = TRANSITIONS[fromStatus] ?? []
  if (!allowed.includes(toStatus as RecruitmentApplicationStatus)) {
    return {
      ok: false,
      error: `Cannot move application from ${fromStatus} to ${toStatus}.`,
    }
  }
  return { ok: true }
}

export function formatPipelineLabel(status: string): string {
  if (status === 'submitted') return 'New'
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/** Pure helper: automatic hiring from interview score is forbidden. */
export function interviewEvaluationAutoHires(): boolean {
  return false
}

export function interviewEvaluationAutoRejects(): boolean {
  return false
}
