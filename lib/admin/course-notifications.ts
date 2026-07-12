export type CourseNotificationParts = {
  status: string
  pendingEnrollments?: number
  pendingCertificates?: number
}

/** Items that need admin action on a single programme. */
export function courseNotificationCount(parts: CourseNotificationParts): number {
  let count = 0
  if (parts.status === 'pending_review') count += 1
  if (parts.status === 'draft') count += 1
  count += parts.pendingEnrollments ?? 0
  count += parts.pendingCertificates ?? 0
  return count
}

export function courseNotificationLabel(count: number): string {
  if (count <= 0) return ''
  return count === 1 ? '1 item needs attention' : `${count} items need attention`
}
