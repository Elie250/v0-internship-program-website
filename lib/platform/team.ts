import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type PublicTeamMember = {
  id: string
  name: string
  title: string | null
  bio: string | null
  photoUrl: string | null
  education: string | null
  experience: string | null
  qualifications: string | null
  cvUrl: string | null
  role: string
  programmes: string[]
}

type TeamUserRow = {
  id: string
  first_name: string | null
  last_name: string | null
  role: string
  profile_title: string | null
  profile_bio: string | null
  profile_photo_url: string | null
  show_on_team: boolean
  profile_education?: string | null
  profile_experience?: string | null
  profile_qualifications?: string | null
  profile_cv_url?: string | null
}

const TEAM_ROLES = ['lecturer', 'instructor', 'support_staff'] as const

const PROFILE_COLUMNS =
  'id, first_name, last_name, role, profile_title, profile_bio, profile_photo_url, show_on_team, profile_education, profile_experience, profile_qualifications, profile_cv_url'

const PROFILE_COLUMNS_NO_CV =
  'id, first_name, last_name, role, profile_title, profile_bio, profile_photo_url, show_on_team'

export async function loadPublicTeamMembers(): Promise<PublicTeamMember[]> {
  if (!supabaseAdmin) return []

  let users: TeamUserRow[] | null = null
  let { data, error } = await supabaseAdmin
    .from('users')
    .select(PROFILE_COLUMNS)
    .in('role', [...TEAM_ROLES])
    .eq('status', 'active')
    .eq('show_on_team', true)
    .order('first_name', { ascending: true })

  if (
    error?.message?.includes('profile_education') ||
    error?.message?.includes('profile_experience') ||
    error?.message?.includes('profile_qualifications') ||
    error?.message?.includes('profile_cv_url')
  ) {
    const fallback = await supabaseAdmin
      .from('users')
      .select(PROFILE_COLUMNS_NO_CV)
      .in('role', [...TEAM_ROLES])
      .eq('status', 'active')
      .eq('show_on_team', true)
      .order('first_name', { ascending: true })
    users = (fallback.data as TeamUserRow[] | null) ?? null
    error = fallback.error
  } else {
    users = (data as TeamUserRow[] | null) ?? null
  }

  if (error?.message?.includes('show_on_team') || error?.message?.includes('profile_')) {
    return []
  }

  if (error || !users?.length) return []

  const userIds = users.map((u) => u.id)
  const programmesByUser = new Map<string, string[]>()

  const { data: courses } = await supabaseAdmin
    .from('courses')
    .select('title, instructor_id')
    .in('instructor_id', userIds)
    .eq('status', 'published')
    .order('title', { ascending: true })

  for (const course of courses ?? []) {
    const instructorId = String(course.instructor_id ?? '')
    if (!instructorId) continue
    const list = programmesByUser.get(instructorId) ?? []
    list.push(String(course.title ?? 'Programme'))
    programmesByUser.set(instructorId, list)
  }

  return users.map((user) => {
    const firstName = String(user.first_name ?? '')
    const lastName = String(user.last_name ?? '')
    return {
      id: user.id,
      name: [firstName, lastName].filter(Boolean).join(' ') || 'Team member',
      title: user.profile_title ? String(user.profile_title) : null,
      bio: user.profile_bio ? String(user.profile_bio) : null,
      photoUrl: user.profile_photo_url ? String(user.profile_photo_url) : null,
      education: user.profile_education ? String(user.profile_education) : null,
      experience: user.profile_experience ? String(user.profile_experience) : null,
      qualifications: user.profile_qualifications ? String(user.profile_qualifications) : null,
      cvUrl: user.profile_cv_url ? String(user.profile_cv_url) : null,
      role: String(user.role),
      programmes: programmesByUser.get(user.id) ?? [],
    }
  })
}
