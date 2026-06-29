import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type AssignableLecturer = {
  id: string
  name: string
  email: string
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
