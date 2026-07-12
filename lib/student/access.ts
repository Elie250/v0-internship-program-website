import { getCurrentUser } from '@/app/actions/auth-service'

export type StudentSession = {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
}

const STUDENT_ROLES = new Set(['student', 'applicant', 'registered'])

export async function requireStudentSession(): Promise<StudentSession> {
  const user = await getCurrentUser()
  if (!user?.id) {
    throw new Error('Unauthorized')
  }
  if (!STUDENT_ROLES.has(user.role)) {
    throw new Error('Student access only')
  }
  return user as StudentSession
}
