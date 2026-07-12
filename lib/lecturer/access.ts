import { getCurrentUser } from '@/app/actions/auth-service'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  canDeliverProgramType,
  isDeliveryPortalRole,
  programTypesForDeliveryRole,
} from '@/lib/lecturer/delivery-portal'

export type LecturerSession = {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
}

export async function requireLecturerSession(): Promise<LecturerSession> {
  const user = await getCurrentUser()
  if (!user?.id) {
    throw new Error('Unauthorized')
  }
  if (!isDeliveryPortalRole(user.role)) {
    throw new Error('Lecturer access only')
  }
  return user as LecturerSession
}

export async function requireLecturerCourseAccess(courseId: string) {
  if (!supabaseAdmin) {
    throw new Error('Database not configured')
  }

  const user = await requireLecturerSession()
  const { data: course, error } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!course || String(course.instructor_id) !== String(user.id)) {
    throw new Error('You are not assigned to this programme')
  }

  if (!canDeliverProgramType(user.role, course.program_type)) {
    throw new Error('You are not assigned to this programme')
  }

  return { user, course }
}

export function applyDeliveryProgramScope<T extends { in: (column: string, values: string[]) => T }>(
  query: T,
  role: string
): T {
  const allowed = programTypesForDeliveryRole(role)
  if (!allowed?.length) return query
  return query.in('program_type', allowed)
}
