import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type AlumniProfile = {
  id: string
  userId: string
  firstName: string
  lastName: string
  programmeTitle: string | null
  graduationYear: number | null
  headline: string | null
  bio: string | null
  linkedinUrl: string | null
}

export async function loadPublicAlumniProfiles(limit = 50): Promise<AlumniProfile[]> {
  if (!supabaseAdmin) return []

  const { data, error } = await supabaseAdmin
    .from('alumni_profiles')
    .select('id, user_id, programme_title, graduation_year, headline, bio, linkedin_url, users(first_name, last_name)')
    .eq('is_public', true)
    .order('graduation_year', { ascending: false })
    .limit(limit)

  if (error) {
    if (error.message.includes('alumni_profiles')) return []
    return []
  }

  return (data ?? []).map((row) => {
    const user = row.users as { first_name?: string; last_name?: string } | null
    return {
      id: String(row.id),
      userId: String(row.user_id),
      firstName: String(user?.first_name ?? ''),
      lastName: String(user?.last_name ?? ''),
      programmeTitle: row.programme_title != null ? String(row.programme_title) : null,
      graduationYear: row.graduation_year != null ? Number(row.graduation_year) : null,
      headline: row.headline != null ? String(row.headline) : null,
      bio: row.bio != null ? String(row.bio) : null,
      linkedinUrl: row.linkedin_url != null ? String(row.linkedin_url) : null,
    }
  })
}

export async function loadAlumniProfileForUser(userId: string) {
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin
    .from('alumni_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error?.message?.includes('alumni_profiles')) return null
  if (error || !data) return null

  return {
    id: String(data.id),
    userId: String(data.user_id),
    programmeTitle: data.programme_title != null ? String(data.programme_title) : null,
    graduationYear: data.graduation_year != null ? Number(data.graduation_year) : null,
    headline: data.headline != null ? String(data.headline) : null,
    bio: data.bio != null ? String(data.bio) : null,
    linkedinUrl: data.linkedin_url != null ? String(data.linkedin_url) : null,
    isPublic: Boolean(data.is_public),
  }
}
