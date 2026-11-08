import { PENDING_ENROLLMENT_STATUSES, type AccessState } from './constants.ts'

export type CourseAccessConfig = {
  program_start_date?: string | null
  program_end_date?: string | null
  default_access_days?: number | null
}

export type EnrollmentAccessRow = {
  status: string
  access_starts_at?: string | null
  access_ends_at?: string | null
}

const REPLAY_GRACE_DAYS = 30

/** Used by admitEnrollmentById when the course has no positive configured value. */
export const DEFAULT_ACCESS_DAYS_FALLBACK = 90

/** PostgreSQL INTEGER upper bound for courses.default_access_days. */
export const MAX_DEFAULT_ACCESS_DAYS = 2_147_483_647

/**
 * Parse admin input for courses.default_access_days.
 * Empty/null clears the configured value (admission then uses the 90-day fallback).
 * Does not rewrite historical enrollment access dates.
 */
export function parseDefaultAccessDaysInput(
  value: unknown
): { ok: true; days: number | null } | { ok: false; error: string } {
  if (value === undefined || value === null) {
    return { ok: true, days: null }
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      return { ok: false, error: 'Classroom access duration must be a whole number of days.' }
    }
    if (value <= 0) {
      return { ok: false, error: 'Classroom access duration must be a positive number of days.' }
    }
    if (value > MAX_DEFAULT_ACCESS_DAYS) {
      return {
        ok: false,
        error: `Classroom access duration cannot exceed ${MAX_DEFAULT_ACCESS_DAYS.toLocaleString()} days.`,
      }
    }
    return { ok: true, days: value }
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return { ok: true, days: null }
    if (!/^\d+$/.test(trimmed)) {
      return { ok: false, error: 'Classroom access duration must be a whole number of days.' }
    }
    const parsed = Number(trimmed)
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      return { ok: false, error: 'Classroom access duration must be a positive number of days.' }
    }
    if (parsed > MAX_DEFAULT_ACCESS_DAYS) {
      return {
        ok: false,
        error: `Classroom access duration cannot exceed ${MAX_DEFAULT_ACCESS_DAYS.toLocaleString()} days.`,
      }
    }
    return { ok: true, days: parsed }
  }

  return { ok: false, error: 'Classroom access duration must be a whole number of days.' }
}

export function computeAccessWindow(
  course: CourseAccessConfig,
  admittedAt: Date = new Date()
): { accessStartsAt: string; accessEndsAt: string | null } {
  let accessStartsAt: Date

  if (course.program_start_date) {
    const programStart = new Date(`${course.program_start_date}T00:00:00`)
    accessStartsAt = programStart.getTime() > admittedAt.getTime() ? programStart : admittedAt
  } else {
    accessStartsAt = admittedAt
  }

  let accessEndsAt: Date | null = null

  if (course.program_end_date) {
    accessEndsAt = new Date(`${course.program_end_date}T23:59:59`)
    accessEndsAt.setDate(accessEndsAt.getDate() + REPLAY_GRACE_DAYS)
  } else if (course.default_access_days && course.default_access_days > 0) {
    accessEndsAt = new Date(accessStartsAt)
    accessEndsAt.setDate(accessEndsAt.getDate() + course.default_access_days)
  }

  return {
    accessStartsAt: accessStartsAt.toISOString(),
    accessEndsAt: accessEndsAt?.toISOString() ?? null,
  }
}

export function getEnrollmentAccessState(enrollment: EnrollmentAccessRow): AccessState {
  const status = String(enrollment.status)

  if (PENDING_ENROLLMENT_STATUSES.includes(status as (typeof PENDING_ENROLLMENT_STATUSES)[number])) {
    return 'pending'
  }
  if (status === 'payment_rejected') return 'rejected'
  if (status === 'waitlisted') return 'waitlisted'
  if (status === 'cancelled') return 'cancelled'
  if (status === 'refunded') return 'refunded'
  if (status === 'expired') return 'expired'
  if (status !== 'admitted') return 'pending'

  const now = Date.now()
  if (enrollment.access_starts_at && new Date(enrollment.access_starts_at).getTime() > now) {
    return 'upcoming'
  }
  if (enrollment.access_ends_at && new Date(enrollment.access_ends_at).getTime() < now) {
    return 'expired'
  }
  return 'active'
}

export function isContentUnlocked(enrollment: EnrollmentAccessRow): boolean {
  return getEnrollmentAccessState(enrollment) === 'active'
}

export function formatAccessDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
