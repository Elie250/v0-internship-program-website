import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function validateInstructorId(
  instructorId: unknown
): Promise<{ id: string | null; error?: string }> {
  if (!instructorId || instructorId === 'none' || instructorId === '') {
    return { id: null }
  }
  if (!supabaseAdmin) return { id: null, error: 'Database not configured' }

  const id = String(instructorId)
  const { data: instructor, error } = await supabaseAdmin
    .from('users')
    .select('id, role, status')
    .eq('id', id)
    .maybeSingle()

  if (error) return { id: null, error: error.message }
  if (!instructor) return { id: null, error: 'Selected lecturer not found' }
  if (!['lecturer', 'instructor'].includes(String(instructor.role))) {
    return { id: null, error: 'Selected user is not a lecturer account' }
  }
  if (instructor.status !== 'active') {
    return { id: null, error: 'Selected lecturer must be approved (active) before assignment' }
  }
  return { id }
}
