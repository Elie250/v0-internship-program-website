import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { RecruitmentCandidateProfile } from '@/lib/recruitment/types'

const PROFILE_SELECT =
  'id, user_id, headline, phone, location, linkedin_url, portfolio_url, summary, consent_privacy_at, created_at, updated_at'

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
    // Race: another request created it
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
  summary?: string | null
  consentPrivacy?: boolean
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
  if (input.summary !== undefined) updates.summary = input.summary?.trim() || null
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
  return { profile: data as RecruitmentCandidateProfile }
}
