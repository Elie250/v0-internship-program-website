export const RECRUITMENT_ORG_ROLES = [
  'organization_admin',
  'hr_recruiter',
  'hiring_manager',
] as const

export type RecruitmentOrgRole = (typeof RECRUITMENT_ORG_ROLES)[number]

export const RECRUITMENT_ORG_STATUSES = ['draft', 'active', 'suspended'] as const
export type RecruitmentOrgStatus = (typeof RECRUITMENT_ORG_STATUSES)[number]

export const RECRUITMENT_MEMBERSHIP_STATUSES = [
  'invited',
  'active',
  'suspended',
  'removed',
] as const
export type RecruitmentMembershipStatus = (typeof RECRUITMENT_MEMBERSHIP_STATUSES)[number]

export type RecruitmentOrganization = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  careers_blurb: string | null
  status: RecruitmentOrgStatus
  notification_email: string | null
  created_at: string
  updated_at: string
}

export type RecruitmentMembership = {
  id: string
  organization_id: string
  user_id: string
  role: RecruitmentOrgRole
  status: RecruitmentMembershipStatus
  created_at: string
  updated_at: string
}

export type RecruitmentCandidateProfile = {
  id: string
  user_id: string
  headline: string | null
  phone: string | null
  location: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  summary: string | null
  consent_privacy_at: string | null
  created_at: string
  updated_at: string
}

export function isRecruitmentOrgRole(value: string): value is RecruitmentOrgRole {
  return (RECRUITMENT_ORG_ROLES as readonly string[]).includes(value)
}

export function isRecruitmentOrgStatus(value: string): value is RecruitmentOrgStatus {
  return (RECRUITMENT_ORG_STATUSES as readonly string[]).includes(value)
}

export function slugifyOrganizationName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}
