import { getCurrentUser } from '@/app/actions/auth-service'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type HomePortalLink = {
  label: string
  href: string
}

export type HomeActiveCourse = {
  id: string
  title: string
  href: string
}

export type HomePersonalization = {
  displayName: string
  role: string
  portal: HomePortalLink
  activeCourses: HomeActiveCourse[]
  hasEnrollment: boolean
  isStudent: boolean
}

function portalForRole(role: string): HomePortalLink | null {
  if (role === 'admin') return { label: 'Admin console', href: '/admin/dashboard' }
  if (role === 'student' || role === 'registered') {
    return { label: 'Student portal', href: '/student/dashboard' }
  }
  if (role === 'lecturer' || role === 'instructor') {
    return { label: 'Lecturer portal', href: '/lecturer/dashboard' }
  }
  if (role === 'mentor') {
    return { label: 'Career portal', href: '/lecturer/dashboard' }
  }
  if (role === 'engineer') return { label: 'Engineer portal', href: '/engineer/dashboard' }
  return null
}

type JoinedCourseRow = { id: string; title: string } | { id: string; title: string }[] | null

function normalizeCourse(course: JoinedCourseRow): { id: string; title: string } | null {
  if (!course) return null
  if (Array.isArray(course)) return course[0] ?? null
  return course
}

export async function loadHomePersonalization(): Promise<HomePersonalization | null> {
  const user = await getCurrentUser()
  if (!user?.id) return null

  const role = String(user.role ?? '')
  const portal = portalForRole(role)
  if (!portal) return null

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'there'

  let activeCourses: HomeActiveCourse[] = []

  if ((role === 'student' || role === 'registered') && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from('course_enrollments')
      .select('course_id, courses(id, title)')
      .eq('user_id', user.id)
      .eq('status', 'admitted')
      .order('updated_at', { ascending: false })
      .limit(3)

    activeCourses = (data ?? [])
      .map((row) => {
        const course = normalizeCourse(row.courses as JoinedCourseRow)
        const courseId = course?.id ?? row.course_id
        return {
          id: courseId,
          title: course?.title ?? 'Course',
          href: `/student/courses/${courseId}`,
        }
      })
      .filter((item) => Boolean(item.id))
  }

  return {
    displayName,
    role,
    portal,
    activeCourses,
    hasEnrollment: activeCourses.length > 0,
    isStudent: role === 'student' || role === 'registered',
  }
}

export type HomeHeroCtas = {
  primaryLabel: string
  primaryUrl: string
  secondaryLabel: string
  secondaryUrl: string
}

export function resolveHomeHeroCtas(
  personalization: HomePersonalization | null,
  heroDefaults?: {
    primaryLabel?: string | null
    primaryUrl?: string | null
    secondaryLabel?: string | null
    secondaryUrl?: string | null
  }
): HomeHeroCtas {
  if (personalization) {
    return {
      primaryLabel: `Go to ${personalization.portal.label.toLowerCase()}`,
      primaryUrl: personalization.portal.href,
      secondaryLabel: 'Explore Library',
      secondaryUrl: '/library',
    }
  }

  return {
    primaryLabel: 'Create account',
    primaryUrl: '/auth/register',
    secondaryLabel: 'Browse programmes',
    secondaryUrl: '/learning',
  }
}
