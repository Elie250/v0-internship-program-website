import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type LecturerCourseSummary = {
  courseId: string
  title: string
  status: string
}

export type LecturerRegistryRow = {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: string
  status: string
  createdAt: string
  assignedCourses: LecturerCourseSummary[]
  courseCount: number
}

export async function queryLecturersRegistry(filters?: {
  search?: string
}): Promise<{ lecturers: LecturerRegistryRow[]; error?: string }> {
  if (!supabaseAdmin) {
    return { lecturers: [], error: 'Database not configured' }
  }

  let userQuery = supabaseAdmin
    .from('users')
    .select('id, email, first_name, last_name, phone, role, status, created_at')
    .in('role', ['lecturer', 'instructor'])
    .order('created_at', { ascending: false })

  if (filters?.search?.trim()) {
    const term = filters.search.trim()
    userQuery = userQuery.or(
      `email.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.ilike.%${term}%`
    )
  }

  const { data: users, error: userError } = await userQuery
  if (userError) return { lecturers: [], error: userError.message }

  const userIds = (users ?? []).map((u) => u.id)
  let courseRows: Array<Record<string, unknown>> = []

  if (userIds.length) {
    const { data, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, title, status, instructor_id')
      .in('instructor_id', userIds)
      .order('title', { ascending: true })

    if (courseError) return { lecturers: [], error: courseError.message }
    courseRows = data ?? []
  }

  const coursesByInstructor = new Map<string, LecturerCourseSummary[]>()
  for (const row of courseRows) {
    const instructorId = String(row.instructor_id ?? '')
    if (!instructorId) continue
    const summary: LecturerCourseSummary = {
      courseId: String(row.id),
      title: String(row.title ?? 'Course'),
      status: String(row.status ?? 'draft'),
    }
    const list = coursesByInstructor.get(instructorId) ?? []
    list.push(summary)
    coursesByInstructor.set(instructorId, list)
  }

  const lecturers: LecturerRegistryRow[] = (users ?? []).map((u) => {
    const firstName = u.first_name ?? ''
    const lastName = u.last_name ?? ''
    const assignedCourses = coursesByInstructor.get(u.id) ?? []
    return {
      id: u.id,
      email: u.email,
      fullName: [firstName, lastName].filter(Boolean).join(' ') || u.email,
      phone: u.phone ?? null,
      role: String(u.role),
      status: String(u.status ?? 'active'),
      createdAt: u.created_at,
      assignedCourses,
      courseCount: assignedCourses.length,
    }
  })

  return { lecturers }
}
