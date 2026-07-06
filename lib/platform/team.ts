import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type PublicTeamMember = {
  id: string
  name: string
  title: string | null
  bio: string | null
  photoUrl: string | null
  role: string
  programmes: string[]
}

const TEAM_ROLES = ['lecturer', 'instructor', 'support_staff'] as const

const PROFILE_COLUMNS =
  'id, first_name, last_name, role, profile_title, profile_bio, profile_photo_url, show_on_team'

const PROFILE_COLUMNS_BASE = 'id, first_name, last_name, role'

export async function loadPublicTeamMembers(): Promise<PublicTeamMember[]> {
  if (!supabaseAdmin) return []

  let { data: users, error } = await supabaseAdmin
    .from('users')
    .select(PROFILE_COLUMNS)
    .in('role', [...TEAM_ROLES])
    .eq('status', 'active')
    .eq('show_on_team', true)
    .order('first_name', { ascending: true })

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
      role: String(user.role),
      programmes: programmesByUser.get(user.id) ?? [],
    }
  })
}
