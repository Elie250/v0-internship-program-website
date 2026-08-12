/**
 * Client-safe job deadline helpers (no DB / server imports).
 */

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

/**
 * Convert a browser datetime-local value to an ISO timestamp for storage.
 * Midnight (00:00) is treated as end of that local calendar day so a chosen
 * "deadline date" remains open through the whole day.
 */
export function serializeApplicationDeadlineInput(
  value: string | null | undefined
): string | null {
  const raw = value?.trim()
  if (!raw) return null

  const localMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (localMatch) {
    const year = Number(localMatch[1])
    const month = Number(localMatch[2]) - 1
    const day = Number(localMatch[3])
    let hours = Number(localMatch[4])
    let minutes = Number(localMatch[5])
    let seconds = Number(localMatch[6] ?? '0')

    if (hours === 0 && minutes === 0 && seconds === 0) {
      hours = 23
      minutes = 59
      seconds = 59
    }

    const local = new Date(year, month, day, hours, minutes, seconds, seconds === 59 ? 999 : 0)
    if (Number.isNaN(local.getTime())) return null
    return local.toISOString()
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

/** Format a stored ISO deadline for <input type="datetime-local"> (local wall time). */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
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
