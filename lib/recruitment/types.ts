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



export const RECRUITMENT_JOB_STATUSES = ['draft', 'published', 'closed', 'archived'] as const

export type RecruitmentJobStatus = (typeof RECRUITMENT_JOB_STATUSES)[number]



export const RECRUITMENT_EMPLOYMENT_TYPES = [

  'full_time',

  'part_time',

  'contract',

  'internship',

  'temporary',

] as const

export type RecruitmentEmploymentType = (typeof RECRUITMENT_EMPLOYMENT_TYPES)[number]



export const RECRUITMENT_WORK_MODES = ['on_site', 'remote', 'hybrid'] as const

export type RecruitmentWorkMode = (typeof RECRUITMENT_WORK_MODES)[number]



export const RECRUITMENT_APPLICATION_STATUSES = [
  'submitted',
  'under_review',
  'screening',
  'shortlisted',
  'interview',
  'offer',
  'hired',
  'rejected',
  'withdrawn',
] as const

export type RecruitmentApplicationStatus = (typeof RECRUITMENT_APPLICATION_STATUSES)[number]



export const RECRUITMENT_DOCUMENT_TYPES = ['cv', 'cover_letter', 'other'] as const

export type RecruitmentDocumentType = (typeof RECRUITMENT_DOCUMENT_TYPES)[number]



export const RECRUITMENT_DOCUMENT_SCAN_STATUSES = [

  'pending',

  'clean',

  'rejected',

  'failed',

] as const

export type RecruitmentDocumentScanStatus = (typeof RECRUITMENT_DOCUMENT_SCAN_STATUSES)[number]



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



export type RecruitmentProfileEducation = {

  institution?: string

  degree?: string

  field?: string

  startYear?: string

  endYear?: string

}



export type RecruitmentProfileExperience = {

  company?: string

  title?: string

  location?: string

  startDate?: string

  endDate?: string

  description?: string

}



export type RecruitmentCandidateProfile = {

  id: string

  user_id: string

  headline: string | null

  phone: string | null

  location: string | null

  linkedin_url: string | null

  portfolio_url: string | null

  github_url: string | null

  summary: string | null

  skills: string[]

  education: RecruitmentProfileEducation[]

  experience: RecruitmentProfileExperience[]

  consent_privacy_at: string | null

  created_at: string

  updated_at: string

}



export type RecruitmentJob = {

  id: string

  organization_id: string

  title: string

  slug: string

  description: string | null

  responsibilities: string | null

  requirements: string | null

  qualifications: string | null

  location: string | null

  employment_type: RecruitmentEmploymentType | null

  work_mode: RecruitmentWorkMode | null

  category: string | null

  department: string | null

  skills: string[]

  salary_min: number | null

  salary_max: number | null

  salary_currency: string | null

  salary_visible: boolean

  visibility: RecruitmentJobVisibility

  status: RecruitmentJobStatus

  published_at: string | null

  application_deadline: string | null

  created_at: string

  updated_at: string

}



export type RecruitmentJobWithOrganization = RecruitmentJob & {

  organization?: Pick<

    RecruitmentOrganization,

    'name' | 'slug' | 'logo_url' | 'status'

  > | null

}



export type RecruitmentDocument = {

  id: string

  candidate_user_id: string

  application_id: string | null

  document_type: RecruitmentDocumentType

  storage_key: string

  original_filename: string

  mime_type: string

  size_bytes: number

  scan_status: RecruitmentDocumentScanStatus

  created_at: string

  deleted_at: string | null

}



export type RecruitmentApplication = {

  id: string

  job_id: string

  candidate_user_id: string

  status: RecruitmentApplicationStatus

  cv_document_id: string | null

  profile_snapshot: Record<string, unknown>

  submitted_at: string

  created_at: string

  updated_at: string

}



export type RecruitmentApplicationWithJob = RecruitmentApplication & {

  job?: RecruitmentJobWithOrganization | null

}



export function isRecruitmentOrgRole(value: string): value is RecruitmentOrgRole {

  return (RECRUITMENT_ORG_ROLES as readonly string[]).includes(value)

}



export function isRecruitmentOrgStatus(value: string): value is RecruitmentOrgStatus {

  return (RECRUITMENT_ORG_STATUSES as readonly string[]).includes(value)

}



export function isRecruitmentJobStatus(value: string): value is RecruitmentJobStatus {

  return (RECRUITMENT_JOB_STATUSES as readonly string[]).includes(value)

}



export function isRecruitmentEmploymentType(value: string): value is RecruitmentEmploymentType {

  return (RECRUITMENT_EMPLOYMENT_TYPES as readonly string[]).includes(value)

}



export function isRecruitmentWorkMode(value: string): value is RecruitmentWorkMode {

  return (RECRUITMENT_WORK_MODES as readonly string[]).includes(value)

}



export function isRecruitmentApplicationStatus(

  value: string

): value is RecruitmentApplicationStatus {

  return (RECRUITMENT_APPLICATION_STATUSES as readonly string[]).includes(value)

}



export function slugifyOrganizationName(input: string): string {

  return input

    .trim()

    .toLowerCase()

    .replace(/[^a-z0-9]+/g, '-')

    .replace(/^-+|-+$/g, '')

    .slice(0, 64)

}



export function slugifyJobTitle(input: string): string {

  return slugifyOrganizationName(input).slice(0, 80) || 'job'

}



export function formatEmploymentType(value: RecruitmentEmploymentType | null): string {

  if (!value) return 'Not specified'

  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

}



export function formatWorkMode(value: RecruitmentWorkMode | null): string {

  if (!value) return 'Not specified'

  if (value === 'on_site') return 'On-site'

  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

}



export function formatApplicationStatus(value: RecruitmentApplicationStatus): string {

  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

}



export const WITHDRAWABLE_APPLICATION_STATUSES: RecruitmentApplicationStatus[] = [

  'submitted',

  'under_review',

]



export const ACTIVE_APPLICATION_STATUSES: RecruitmentApplicationStatus[] = [
  'submitted',
  'under_review',
  'screening',
  'shortlisted',
  'interview',
  'offer',
  'hired',
]

export const EMPLOYER_PIPELINE_STATUSES: RecruitmentApplicationStatus[] = [
  'submitted',
  'under_review',
  'screening',
  'shortlisted',
  'interview',
  'offer',
  'hired',
  'rejected',
]

export const RECRUITMENT_JOB_VISIBILITIES = ['public', 'unlisted'] as const
export type RecruitmentJobVisibility = (typeof RECRUITMENT_JOB_VISIBILITIES)[number]

export const RECRUITMENT_QUESTION_OWNER_TYPES = ['platform', 'organization'] as const
export type RecruitmentQuestionOwnerType = (typeof RECRUITMENT_QUESTION_OWNER_TYPES)[number]

export const RECRUITMENT_QUESTION_DIFFICULTIES = ['easy', 'medium', 'hard'] as const
export type RecruitmentQuestionDifficulty = (typeof RECRUITMENT_QUESTION_DIFFICULTIES)[number]

export const RECRUITMENT_ATTEMPT_POLICIES = ['single', 'retry_once', 'unlimited'] as const
export type RecruitmentAttemptPolicy = (typeof RECRUITMENT_ATTEMPT_POLICIES)[number]

export const RECRUITMENT_QUESTION_SELECTIONS = ['manual', 'random_from_bank', 'mixed'] as const
export type RecruitmentQuestionSelection = (typeof RECRUITMENT_QUESTION_SELECTIONS)[number]

export const RECRUITMENT_QUESTION_TYPES = [
  'multiple_choice',
  'multiple_select',
  'numeric',
  'short_text',
] as const
export type RecruitmentQuestionType = (typeof RECRUITMENT_QUESTION_TYPES)[number]

export const RECRUITMENT_SCREENING_SESSION_STATUSES = [
  'in_progress',
  'submitted',
  'expired',
  'cancelled',
] as const
export type RecruitmentScreeningSessionStatus =
  (typeof RECRUITMENT_SCREENING_SESSION_STATUSES)[number]

export function isRecruitmentJobVisibility(value: string): value is RecruitmentJobVisibility {
  return (RECRUITMENT_JOB_VISIBILITIES as readonly string[]).includes(value)
}

export function isRecruitmentQuestionDifficulty(
  value: string
): value is RecruitmentQuestionDifficulty {
  return (RECRUITMENT_QUESTION_DIFFICULTIES as readonly string[]).includes(value)
}

export function isRecruitmentQuestionType(value: string): value is RecruitmentQuestionType {
  return (RECRUITMENT_QUESTION_TYPES as readonly string[]).includes(value)
}


