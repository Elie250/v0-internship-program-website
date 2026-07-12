import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { MENTOR_PROGRAM_TYPES } from '@/lib/enrollment/program-types'

export type MentorCourseSummary = {
  courseId: string
  title: string
  status: string
  program_type: string
}

export type MentorRegistryRow = {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: string
  status: string
  createdAt: string
  assignedCourses: MentorCourseSummary[]
  courseCount: number
}

export type AssignableMentor = {
  id: string
  name: string
  email: string
}

export async function queryAssignableMentors(): Promise<{
  mentors: AssignableMentor[]
  error?: string
}> {
  if (!supabaseAdmin) {
    return { mentors: [], error: 'Database not configured' }
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, first_name, last_name, role, status')
    .eq('role', 'mentor')
    .eq('status', 'active')
    .order('first_name')

  if (error) return { mentors: [], error: error.message }

  return {
    mentors: (data ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email,
    })),
  }
}

export async function queryMentorsRegistry(filters?: {
  search?: string
}): Promise<{ mentors: MentorRegistryRow[]; error?: string }> {
  if (!supabaseAdmin) {
    return { mentors: [], error: 'Database not configured' }
  }

  let userQuery = supabaseAdmin
    .from('users')
    .select('id, email, first_name, last_name, phone, role, status, created_at')
    .eq('role', 'mentor')
    .order('created_at', { ascending: false })

  if (filters?.search?.trim()) {
    const term = filters.search.trim()
    userQuery = userQuery.or(
      `email.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.ilike.%${term}%`
    )
  }

  const { data: users, error: userError } = await userQuery
  if (userError) return { mentors: [], error: userError.message }

  const userIds = (users ?? []).map((u) => u.id)
  let courseRows: Array<Record<string, unknown>> = []

  if (userIds.length) {
    const { data, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, title, status, instructor_id, program_type')
      .in('instructor_id', userIds)
      .in('program_type', MENTOR_PROGRAM_TYPES)
      .order('title', { ascending: true })

    if (courseError) return { mentors: [], error: courseError.message }
    courseRows = data ?? []
  }

  const coursesByMentor = new Map<string, MentorCourseSummary[]>()
  for (const row of courseRows) {
    const mentorId = String(row.instructor_id ?? '')
    if (!mentorId) continue
    const summary: MentorCourseSummary = {
      courseId: String(row.id),
      title: String(row.title ?? 'Programme'),
      status: String(row.status ?? 'draft'),
      program_type: String(row.program_type ?? 'mentorship'),
    }
    const list = coursesByMentor.get(mentorId) ?? []
    list.push(summary)
    coursesByMentor.set(mentorId, list)
  }

  const mentors: MentorRegistryRow[] = (users ?? []).map((u) => {
    const assignedCourses = coursesByMentor.get(u.id) ?? []
    return {
      id: u.id,
      email: u.email,
      fullName: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email,
      phone: u.phone ?? null,
      role: String(u.role),
      status: String(u.status ?? 'active'),
      createdAt: u.created_at,
      assignedCourses,
      courseCount: assignedCourses.length,
    }
  })

  return { mentors }
}
