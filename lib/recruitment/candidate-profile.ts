import { supabaseAdmin } from '@/lib/supabaseAdmin'

import { writeRecruitmentAudit } from '@/lib/recruitment/audit'

import type {

  RecruitmentCandidateProfile,

  RecruitmentProfileEducation,

  RecruitmentProfileExperience,

} from '@/lib/recruitment/types'



const PROFILE_SELECT =

  'id, user_id, headline, phone, location, linkedin_url, portfolio_url, github_url, summary, skills, education, experience, consent_privacy_at, created_at, updated_at'



function normalizeStringArray(value: unknown): string[] {

  if (!Array.isArray(value)) return []

  return value

    .map((item) => String(item ?? '').trim())

    .filter(Boolean)

    .slice(0, 50)

}



function normalizeJsonArray<T extends Record<string, unknown>>(value: unknown, max = 20): T[] {

  if (!Array.isArray(value)) return []

  return value

    .filter((item) => item && typeof item === 'object' && !Array.isArray(item))

    .slice(0, max) as T[]

}



export function calculateProfileCompletion(profile: RecruitmentCandidateProfile | null): {

  percent: number

  missing: string[]

} {

  if (!profile) return { percent: 0, missing: ['profile'] }



  const checks: Array<[string, boolean]> = [

    ['headline', Boolean(profile.headline?.trim())],

    ['phone', Boolean(profile.phone?.trim())],

    ['location', Boolean(profile.location?.trim())],

    ['summary', Boolean(profile.summary?.trim())],

    ['skills', (profile.skills?.length ?? 0) > 0],

    ['education or experience', (profile.education?.length ?? 0) > 0 || (profile.experience?.length ?? 0) > 0],

    ['LinkedIn, portfolio, or GitHub', Boolean(profile.linkedin_url || profile.portfolio_url || profile.github_url)],

  ]



  const complete = checks.filter(([, ok]) => ok).length

  const missing = checks.filter(([, ok]) => !ok).map(([label]) => label)

  return { percent: Math.round((complete / checks.length) * 100), missing }

}



export async function ensureCandidateProfile(

  userId: string

): Promise<{ profile?: RecruitmentCandidateProfile; error?: string }> {

  if (!supabaseAdmin) return { error: 'Database not configured' }



  const existing = await supabaseAdmin

    .from('recruitment_candidate_profiles')

    .select(PROFILE_SELECT)

    .eq('user_id', userId)

    .maybeSingle()



  if (existing.data) {

    return { profile: existing.data as RecruitmentCandidateProfile }

  }



  const { data, error } = await supabaseAdmin

    .from('recruitment_candidate_profiles')

    .insert([{ user_id: userId }])

    .select(PROFILE_SELECT)

    .single()



  if (error) {

    const again = await supabaseAdmin

      .from('recruitment_candidate_profiles')

      .select(PROFILE_SELECT)

      .eq('user_id', userId)

      .maybeSingle()

    if (again.data) return { profile: again.data as RecruitmentCandidateProfile }

    return { error: error.message }

  }



  return { profile: data as RecruitmentCandidateProfile }

}



export async function getCandidateProfileForUser(

  userId: string

): Promise<{ profile: RecruitmentCandidateProfile | null; error?: string }> {

  if (!supabaseAdmin) return { profile: null, error: 'Database not configured' }

  const { data, error } = await supabaseAdmin

    .from('recruitment_candidate_profiles')

    .select(PROFILE_SELECT)

    .eq('user_id', userId)

    .maybeSingle()

  if (error) return { profile: null, error: error.message }

  return { profile: (data as RecruitmentCandidateProfile | null) ?? null }

}



export async function updateCandidateProfile(input: {

  userId: string

  headline?: string | null

  phone?: string | null

  location?: string | null

  linkedinUrl?: string | null

  portfolioUrl?: string | null

  githubUrl?: string | null

  summary?: string | null

  skills?: unknown

  education?: unknown

  experience?: unknown

  consentPrivacy?: boolean

  actorUserId?: string

}): Promise<{ profile?: RecruitmentCandidateProfile; error?: string }> {

  if (!supabaseAdmin) return { error: 'Database not configured' }



  const ensured = await ensureCandidateProfile(input.userId)

  if (ensured.error || !ensured.profile) return { error: ensured.error ?? 'Profile missing' }



  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (input.headline !== undefined) updates.headline = input.headline?.trim() || null

  if (input.phone !== undefined) updates.phone = input.phone?.trim() || null

  if (input.location !== undefined) updates.location = input.location?.trim() || null

  if (input.linkedinUrl !== undefined) updates.linkedin_url = input.linkedinUrl?.trim() || null

  if (input.portfolioUrl !== undefined) updates.portfolio_url = input.portfolioUrl?.trim() || null

  if (input.githubUrl !== undefined) updates.github_url = input.githubUrl?.trim() || null

  if (input.summary !== undefined) updates.summary = input.summary?.trim() || null

  if (input.skills !== undefined) updates.skills = normalizeStringArray(input.skills)

  if (input.education !== undefined) {

    updates.education = normalizeJsonArray<RecruitmentProfileEducation>(input.education)

  }

  if (input.experience !== undefined) {

    updates.experience = normalizeJsonArray<RecruitmentProfileExperience>(input.experience)

  }

  if (input.consentPrivacy === true) {

    updates.consent_privacy_at = new Date().toISOString()

  }



  const { data, error } = await supabaseAdmin

    .from('recruitment_candidate_profiles')

    .update(updates)

    .eq('user_id', input.userId)

    .select(PROFILE_SELECT)

    .maybeSingle()



  if (error) return { error: error.message }

  if (!data) return { error: 'Profile not found' }



  await writeRecruitmentAudit({

    actorUserId: input.actorUserId ?? input.userId,

    action: 'candidate_profile_updated',

    entityType: 'recruitment_candidate_profiles',

    entityId: data.id,

  })



  return { profile: data as RecruitmentCandidateProfile }

}


