import { PENDING_ENROLLMENT_STATUSES } from '@/lib/enrollment/constants'
import { getEnrollmentAccessState, type EnrollmentAccessRow } from '@/lib/enrollment/access'
import { normalizeProgramType, type ProgramType } from '@/lib/enrollment/program-types'

export type EnrollmentRow = {
  id: string
  course_id: string
  status: string
  program_type?: string | null
  access_starts_at?: string | null
  access_ends_at?: string | null
}

const TERMINAL_STATUSES = new Set(['cancelled', 'payment_rejected', 'refunded'])

/**
 * Programme types that are limited to one active enrollment at a time.
 * Career & events (mentorship, career_guidance, workshop, webinar, event) are
 * unrestricted so a student can attend them while doing a training/internship.
 */
const EXCLUSIVE_TRACKS: ProgramType[] = ['training', 'internship']

function trackKey(programType: string | null | undefined): ProgramType | null {
  const type = normalizeProgramType(programType)
  return EXCLUSIVE_TRACKS.includes(type) ? type : null
}

const EXCLUSIVE_TRACK_LABEL: Record<string, string> = {
  training: 'training',
  internship: 'internship',
}

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

/** Blocking enrollment within the SAME exclusive track (training or internship). */
export function findBlockingEnrollmentForTrack(
  rows: EnrollmentRow[],
  track: ProgramType
): EnrollmentRow | null {
  return (
    rows.find((row) => trackKey(row.program_type) === track && isBlockingEnrollment(row)) ?? null
  )
}

export type EnrollEligibility = {
  canEnroll: boolean
  reason: string | null
  blockingCourseId: string | null
}

export function getEnrollEligibility(
  rows: EnrollmentRow[],
  targetCourseId?: string,
  targetProgramType?: string | null
): EnrollEligibility {
  const targetRow = targetCourseId
    ? rows.find((r) => r.course_id === targetCourseId && !TERMINAL_STATUSES.has(String(r.status)))
    : undefined

  const resolvedType = targetProgramType ?? targetRow?.program_type ?? null
  const track = trackKey(resolvedType)

  // Career & events programmes are always open (no one-at-a-time restriction).
  if (targetCourseId && track === null) {
    if (targetRow) {
      const status = String(targetRow.status)
      if (PENDING_ENROLLMENT_STATUSES.includes(status as (typeof PENDING_ENROLLMENT_STATUSES)[number])) {
        return {
          canEnroll: false,
          reason: 'You already have a pending enrollment for this programme.',
          blockingCourseId: targetCourseId,
        }
      }
      if (status === 'admitted') {
        const state = getEnrollmentAccessState({
          status,
          access_starts_at: targetRow.access_starts_at,
          access_ends_at: targetRow.access_ends_at,
        })
        if (state === 'active' || state === 'upcoming') {
          return {
            canEnroll: false,
            reason: 'You are already enrolled in this programme.',
            blockingCourseId: targetCourseId,
          }
        }
      }
    }
    return { canEnroll: true, reason: null, blockingCourseId: null }
  }

  // Exclusive track (training / internship) — one active at a time within that track.
  if (targetCourseId && track) {
    const blocking = findBlockingEnrollmentForTrack(rows, track)

    if (blocking && blocking.course_id === targetCourseId) {
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

    if (blocking && blocking.course_id !== targetCourseId) {
      const label = EXCLUSIVE_TRACK_LABEL[track] ?? 'programme'
      return {
        canEnroll: false,
        reason: `You can enroll in one ${label} at a time. Finish your current ${label} before starting another. You can still join career and events programmes.`,
        blockingCourseId: blocking.course_id,
      }
    }

    return { canEnroll: true, reason: null, blockingCourseId: null }
  }

  // No target course: report whether any exclusive track is currently blocked.
  for (const t of EXCLUSIVE_TRACKS) {
    const blocking = findBlockingEnrollmentForTrack(rows, t)
    if (blocking) {
      const label = EXCLUSIVE_TRACK_LABEL[t] ?? 'programme'
      return {
        canEnroll: false,
        reason: `You have an active ${label}. You can enroll in one ${label} at a time.`,
        blockingCourseId: blocking.course_id,
      }
    }
  }

  return { canEnroll: true, reason: null, blockingCourseId: null }
}
