export type HomePortalLink = {
  label: string
  href: string
}

export function portalForRole(role: string): HomePortalLink | null {
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

/** Header CTA for a signed-in role. Students see learning language, not Login. */
export function headerAccountForRole(role: string): HomePortalLink | null {
  const portal = portalForRole(role)
  if (!portal) return null
  if (role === 'student' || role === 'registered') {
    return { label: 'My learning', href: portal.href }
  }
  return portal
}
