import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type AssignableLecturer = {
  id: string
  name: string
  email: string
}

export type AssignableHost = AssignableLecturer & {
  role: string
}

/**
 * Users who can host an admin-created webinar: lecturer, instructor or engineer.
 */
export async function queryAssignableWebinarHosts(): Promise<{
  hosts: AssignableHost[]
  error?: string
}> {
  if (!supabaseAdmin) {
    return { hosts: [], error: 'Database not configured' }
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, first_name, last_name, role, status')
    .in('role', ['lecturer', 'instructor', 'engineer'])
    .eq('status', 'active')
    .order('first_name')

  if (error) return { hosts: [], error: error.message }

  return {
    hosts: (data ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      role: String(u.role),
      name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email,
    })),
  }
}

export async function queryAssignableLecturers(): Promise<{
  lecturers: AssignableLecturer[]
  error?: string
}> {
  if (!supabaseAdmin) {
    return { lecturers: [], error: 'Database not configured' }
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, first_name, last_name, role, status')
    .in('role', ['lecturer', 'instructor'])
    .eq('status', 'active')
    .order('first_name')

  if (error) return { lecturers: [], error: error.message }

  return {
    lecturers: (data ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email,
    })),
  }
}
