import { PENDING_ENROLLMENT_STATUSES } from '@/lib/enrollment/constants'
import { getEnrollmentAccessState, type EnrollmentAccessRow } from '@/lib/enrollment/access'

export type EnrollmentRow = {
  id: string
  course_id: string
  status: string
  access_starts_at?: string | null
  access_ends_at?: string | null
}

const TERMINAL_STATUSES = new Set(['cancelled', 'payment_rejected', 'refunded'])

export function isBlockingEnrollment(row: EnrollmentRow): boolean {
  const status = String(row.status)
  if (TERMINAL_STATUSES.has(status)) return false
  if (PENDING_ENROLLMENT_STATUSES.includes(status as (typeof PENDING_ENROLLMENT_STATUSES)[number])) {
    return true
  }
  if (status === 'waitlisted') return true
  if (status === 'admitted') {
    const accessRow: EnrollmentAccessRow = {
      status,
      access_starts_at: row.access_starts_at,
      access_ends_at: row.access_ends_at,
    }
    const state = getEnrollmentAccessState(accessRow)
    return state === 'active' || state === 'upcoming'
  }
  return false
}

export function findBlockingEnrollment(rows: EnrollmentRow[]): EnrollmentRow | null {
  return rows.find(isBlockingEnrollment) ?? null
}

export type EnrollEligibility = {
  canEnroll: boolean
  reason: string | null
  blockingCourseId: string | null
}

export function getEnrollEligibility(
  rows: EnrollmentRow[],
  targetCourseId?: string
): EnrollEligibility {
  const blocking = findBlockingEnrollment(rows)

  if (blocking && targetCourseId && blocking.course_id === targetCourseId) {
    const status = String(blocking.status)
    if (PENDING_ENROLLMENT_STATUSES.includes(status as (typeof PENDING_ENROLLMENT_STATUSES)[number])) {
      return {
        canEnroll: false,
        reason: 'You already have a pending enrollment for this course. Check your dashboard.',
        blockingCourseId: blocking.course_id,
      }
    }
    if (status === 'admitted') {
      return {
        canEnroll: false,
        reason: 'You are already enrolled in this course.',
        blockingCourseId: blocking.course_id,
      }
    }
  }

  if (blocking && (!targetCourseId || blocking.course_id !== targetCourseId)) {
    return {
      canEnroll: false,
      reason:
        'You can enroll in one course at a time. Complete or finish your current course before starting another.',
      blockingCourseId: blocking.course_id,
    }
  }

  if (targetCourseId) {
    const sameCourse = rows.find(
      (r) => r.course_id === targetCourseId && !TERMINAL_STATUSES.has(String(r.status))
    )
    if (sameCourse) {
      const status = String(sameCourse.status)
      if (PENDING_ENROLLMENT_STATUSES.includes(status as (typeof PENDING_ENROLLMENT_STATUSES)[number])) {
        return {
          canEnroll: false,
          reason: 'You already have a pending enrollment for this course.',
          blockingCourseId: targetCourseId,
        }
      }
      if (status === 'admitted') {
        const state = getEnrollmentAccessState({
          status,
          access_starts_at: sameCourse.access_starts_at,
          access_ends_at: sameCourse.access_ends_at,
        })
        if (state === 'active' || state === 'upcoming') {
          return {
            canEnroll: false,
            reason: 'You are already enrolled in this course.',
            blockingCourseId: targetCourseId,
          }
        }
      }
    }
  }

  return { canEnroll: true, reason: null, blockingCourseId: null }
}
