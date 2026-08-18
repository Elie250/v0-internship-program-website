/**
 * Client-safe job deadline helpers (no DB / server imports).
 * Calendar days are Rwanda (Africa/Kigali, UTC+2, no DST) so admin and the
 * public job board always show the same "Apply by" date.
 */

export const JOB_DEADLINE_TIMEZONE = 'Africa/Kigali'
const KIGALI_OFFSET = '+02:00'

export function isJobAcceptingApplications(job: {
  status: string
  application_deadline: string | null
}): boolean {
  if (job.status !== 'published') return false
  if (!job.application_deadline) return true
  const deadlineMs = Date.parse(job.application_deadline)
  if (Number.isNaN(deadlineMs)) return false
  return deadlineMs >= Date.now()
}

/** Calendar day (YYYY-MM-DD) of a stored deadline in Africa/Kigali. */
export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: JOB_DEADLINE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  if (!year || !month || !day) return ''
  return `${year}-${month}-${day}`
}

/**
 * Convert a date or datetime-local value to an ISO timestamp for storage.
 * A date-only value (YYYY-MM-DD) is stored as the end of that day in Kigali.
 */
export function serializeApplicationDeadlineInput(
  value: string | null | undefined
): string | null {
  const raw = value?.trim()
  if (!raw) return null

  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnly) {
    const endOfDay = new Date(`${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}T23:59:59.999${KIGALI_OFFSET}`)
    if (Number.isNaN(endOfDay.getTime())) return null
    return endOfDay.toISOString()
  }

  const localMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (localMatch) {
    return serializeApplicationDeadlineInput(
      `${localMatch[1]}-${localMatch[2]}-${localMatch[3]}`
    )
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

/** @deprecated Use toDateInputValue — kept for older datetime-local fields. */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  const date = toDateInputValue(iso)
  if (!date) return ''
  return `${date}T23:59`
}

export function applicationClosedReason(job: {
  status: string
  application_deadline: string | null
}): 'not_published' | 'deadline_passed' | null {
  if (job.status !== 'published') return 'not_published'
  if (!job.application_deadline) return null
  const deadlineMs = Date.parse(job.application_deadline)
  if (Number.isNaN(deadlineMs) || deadlineMs < Date.now()) return 'deadline_passed'
  return null
}

function formatDeadlineDate(deadline: string): string {
  const date = new Date(deadline)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', {
    timeZone: JOB_DEADLINE_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Public listing label from the stored `application_deadline` column (not description text). */
export function formatApplicationDeadlineLabel(deadline: string | null | undefined): string {
  if (!deadline) return 'Open — no deadline'
  const label = formatDeadlineDate(deadline)
  if (!label) return 'Open — no deadline'
  const date = new Date(deadline)
  return date.getTime() < Date.now() ? `Closed ${label}` : `Apply by ${label}`
}
