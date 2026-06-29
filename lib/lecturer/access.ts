import { getCurrentUser } from '@/app/actions/auth-service'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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
  if (user.role !== 'lecturer' && user.role !== 'instructor') {
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

  return { user, course }
}
