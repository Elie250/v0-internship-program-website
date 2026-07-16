/** Collapse paths into coarse buckets so Admin stays readable and rows stay small. */
export function pathGroupFromPath(pathname: string): string {
  const path = (pathname || '/').split('?')[0] || '/'
  if (path === '/') return 'home'
  if (path.startsWith('/tools/brain-training')) return 'brain-training'
  if (path.startsWith('/student/tools/brain-training')) return 'brain-training'
  if (path.startsWith('/lecturer/tools/brain-training')) return 'brain-training'
  if (path.startsWith('/tools')) return 'tools'
  if (path.startsWith('/learning')) return 'learning'
  if (path.startsWith('/shop')) return 'shop'
  if (path.startsWith('/engineering')) return 'engineering'
  if (path.startsWith('/library')) return 'library'
  if (path.startsWith('/apply')) return 'apply'
  if (path.startsWith('/auth')) return 'auth'
  if (path.startsWith('/student')) return 'student-portal'
  if (path.startsWith('/lecturer')) return 'lecturer-portal'
  if (path.startsWith('/admin')) return 'admin'
  if (path.startsWith('/engineer')) return 'engineer-portal'
  if (path.startsWith('/webinars') || path.startsWith('/events')) return 'events'
  if (path.startsWith('/privacy') || path.startsWith('/terms') || path.startsWith('/refund')) {
    return 'legal'
  }
  const first = path.split('/').filter(Boolean)[0]
  return first ? `other:${first}` : 'other'
}
