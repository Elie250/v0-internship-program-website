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
  show_on_team?: boolean
  profile_education?: string | null
  profile_experience?: string | null
  profile_qualifications?: string | null
  profile_cv_url?: string | null
}

const TEAM_ROLES = ['lecturer', 'instructor', 'support_staff'] as const

const TEAM_SELECT_ATTEMPTS = [
  'id, first_name, last_name, role, profile_title, profile_bio, profile_photo_url, show_on_team, profile_education, profile_experience, profile_qualifications, profile_cv_url',
  'id, first_name, last_name, role, profile_title, profile_bio, profile_photo_url, show_on_team',
  'id, first_name, last_name, role, profile_title, profile_bio, profile_photo_url',
]

function isVisibleTeamMember(user: TeamUserRow): boolean {
  const title = String(user.profile_title ?? '').trim()
  const bio = String(user.profile_bio ?? '').trim()
  if (!title || !bio) return false
  return user.show_on_team === true
}

export async function loadPublicTeamMembers(): Promise<PublicTeamMember[]> {
  if (!supabaseAdmin) return []

  let users: TeamUserRow[] | null = null

  for (const select of TEAM_SELECT_ATTEMPTS) {
    const query = supabaseAdmin
      .from('users')
      .select(select)
      .in('role', [...TEAM_ROLES])
      .eq('status', 'active')
      .order('first_name', { ascending: true })

    const withTeamFlag = select.includes('show_on_team')
      ? query.eq('show_on_team', true)
      : query

    const { data, error } = await withTeamFlag
    if (!error && data) {
      users = data as unknown as TeamUserRow[]
      break
    }
  }

  if (!users?.length) return []

  const visible = users.filter(isVisibleTeamMember)
  if (!visible.length) return []

  const userIds = visible.map((u) => u.id)
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

  return visible.map((user) => {
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
