import type { RecruitmentOrgRole } from '@/lib/recruitment/types'

export const JOB_READ_ROLES: RecruitmentOrgRole[] = [
  'organization_admin',
  'hr_recruiter',
  'hiring_manager',
]

export const JOB_WRITE_ROLES: RecruitmentOrgRole[] = ['organization_admin', 'hr_recruiter']

export const APPLICATION_REVIEW_ROLES: RecruitmentOrgRole[] = [
  'organization_admin',
  'hr_recruiter',
  'hiring_manager',
]

export const SCREENING_WRITE_ROLES: RecruitmentOrgRole[] = ['organization_admin', 'hr_recruiter']

export const MEMBER_WRITE_ROLES: RecruitmentOrgRole[] = ['organization_admin']

export const ORG_SETTINGS_ROLES: RecruitmentOrgRole[] = ['organization_admin']

export function roleAllows(
  asPlatformAdmin: boolean,
  membershipRole: RecruitmentOrgRole | null | undefined,
  allowed: RecruitmentOrgRole[]
): boolean {
  if (asPlatformAdmin) return true
  if (!membershipRole) return false
  return allowed.includes(membershipRole)
}
