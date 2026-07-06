import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type StudentEnrollmentSummary = {
  enrollmentId: string
  courseId: string
  courseTitle: string
  status: string
  amountDue: number
  enrolledAt: string
  admittedAt: string | null
}

export type StudentRegistryRow = {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  phone: string | null
  role: string
  status: string
  createdAt: string
  enrollments: StudentEnrollmentSummary[]
  activeEnrollments: number
  pendingEnrollments: number
}

export async function queryStudentsRegistry(filters?: {
  search?: string
}): Promise<{ students: StudentRegistryRow[]; error?: string }> {
  if (!supabaseAdmin) {
    return { students: [], error: 'Database not configured' }
  }

  let userQuery = supabaseAdmin
    .from('users')
    .select('id, email, first_name, last_name, phone, role, status, created_at')
    .in('role', ['student', 'registered'])
    .order('created_at', { ascending: false })

  if (filters?.search?.trim()) {
    const term = filters.search.trim()
    userQuery = userQuery.or(
      `email.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.ilike.%${term}%`
    )
  }

  const { data: users, error: userError } = await userQuery
  if (userError) return { students: [], error: userError.message }

  const userIds = (users ?? []).map((u) => u.id)
  let enrollmentRows: Array<Record<string, unknown>> = []

  if (userIds.length) {
    const { data, error: enrollError } = await supabaseAdmin
      .from('course_enrollments')
      .select(
        'id, user_id, course_id, status, amount_due, created_at, admitted_at, course:courses(title)'
      )
      .in('user_id', userIds)
      .order('created_at', { ascending: false })

    if (enrollError) return { students: [], error: enrollError.message }
    enrollmentRows = data ?? []
  }

  const enrollmentsByUser = new Map<string, StudentEnrollmentSummary[]>()
  for (const row of enrollmentRows) {
    const userId = String(row.user_id ?? '')
    if (!userId) continue
    const courseRel = row.course as { title?: string } | { title?: string }[] | null
    const courseTitle = Array.isArray(courseRel)
      ? courseRel[0]?.title ?? 'Course'
      : courseRel?.title ?? 'Course'
    const summary: StudentEnrollmentSummary = {
      enrollmentId: String(row.id),
      courseId: String(row.course_id),
      courseTitle,
      status: String(row.status ?? ''),
      amountDue: Number(row.amount_due ?? 0),
      enrolledAt: String(row.created_at ?? ''),
      admittedAt: (row.admitted_at as string | null) ?? null,
    }
    const list = enrollmentsByUser.get(userId) ?? []
    list.push(summary)
    enrollmentsByUser.set(userId, list)
  }

  const students: StudentRegistryRow[] = (users ?? []).map((u) => {
    const enrollments = enrollmentsByUser.get(u.id) ?? []
    const firstName = u.first_name ?? ''
    const lastName = u.last_name ?? ''
    return {
      id: u.id,
      email: u.email,
      firstName,
      lastName,
      fullName: [firstName, lastName].filter(Boolean).join(' ') || u.email,
      phone: u.phone ?? null,
      role: String(u.role),
      status: String(u.status ?? 'active'),
      createdAt: u.created_at,
      enrollments,
      activeEnrollments: enrollments.filter((e) => e.status === 'admitted').length,
      pendingEnrollments: enrollments.filter((e) =>
        ['payment_pending_review', 'waitlisted'].includes(e.status)
      ).length,
    }
  })

  return { students }
}
