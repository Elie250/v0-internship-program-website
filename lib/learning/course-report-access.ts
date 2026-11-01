const ADMITTED = 'admitted'

export type ReportEnrollmentAccess = {
  user_id: string | null
  status: string
  course_id: string
  access_starts_at?: string | null
  access_ends_at?: string | null
}

/**
 * Admitted students can read the report before access starts.
 * After the access window ends, the report stays available but live links are hidden.
 * Date rules match getEnrollmentAccessState for status === admitted.
 */
export function decideProgrammeReportAccess(
  enrollment: ReportEnrollmentAccess | null,
  sessionUserId: string | null,
  courseId: string,
  now = Date.now()
): { allowed: true; hideLiveAccess: boolean } | { allowed: false } {
  if (!sessionUserId || !enrollment) return { allowed: false }
  if (enrollment.course_id !== courseId) return { allowed: false }
  if (enrollment.user_id !== sessionUserId) return { allowed: false }
  if (enrollment.status !== ADMITTED) return { allowed: false }

  const endsAt = enrollment.access_ends_at ? new Date(enrollment.access_ends_at).getTime() : null
  const hideLiveAccess = endsAt != null && !Number.isNaN(endsAt) && endsAt < now

  return { allowed: true, hideLiveAccess }
}

/** Dashboard links only. Email-matched rows with a null user_id stay unlinked. */
export function programmeReportHrefForEnrollment(
  enrollmentUserId: string | null | undefined,
  sessionUserId: string | null | undefined,
  courseId: string
): string | null {
  const enrollmentUser = String(enrollmentUserId ?? '').trim()
  const sessionUser = String(sessionUserId ?? '').trim()
  const course = String(courseId ?? '').trim()
  if (!enrollmentUser || !sessionUser || !course) return null
  if (enrollmentUser !== sessionUser) return null
  return `/student/courses/${course}/report`
}

/** Upcoming admitted students keep the report and do not get a classroom button. */
export function programmeReportShowsClassroomLink(
  accessState: 'upcoming' | 'active' | 'expired'
): boolean {
  return accessState !== 'upcoming'
}
