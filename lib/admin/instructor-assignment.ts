import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  isMentorManagedProgramType,
  normalizeProgramType,
} from '@/lib/enrollment/program-types'

export async function validateInstructorId(
  instructorId: unknown,
  programType?: unknown
): Promise<{ id: string | null; error?: string }> {
  if (!instructorId || instructorId === 'none' || instructorId === '') {
    return { id: null }
  }
  if (!supabaseAdmin) return { id: null, error: 'Database not configured' }

  const id = String(instructorId)
  const normalizedProgramType = normalizeProgramType(programType ?? 'training')
  const expectsMentor = isMentorManagedProgramType(normalizedProgramType)

  const { data: instructor, error } = await supabaseAdmin
    .from('users')
    .select('id, role, status')
    .eq('id', id)
    .maybeSingle()

  if (error) return { id: null, error: error.message }
  if (!instructor) {
    return {
      id: null,
      error: expectsMentor ? 'Selected mentor not found' : 'Selected lecturer not found',
    }
  }

  const role = String(instructor.role)
  if (expectsMentor) {
    if (role !== 'mentor') {
      return { id: null, error: 'Career guidance and mentorship programmes must be assigned to a mentor' }
    }
  } else if (!['lecturer', 'instructor'].includes(role)) {
    return { id: null, error: 'Selected user is not a lecturer account' }
  }

  if (instructor.status !== 'active') {
    return {
      id: null,
      error: expectsMentor
        ? 'Selected mentor must be active before assignment'
        : 'Selected lecturer must be approved (active) before assignment',
    }
  }
  return { id }
}
