/** Candidate-facing interview labels. Safe for client and server. */

export function interviewCandidateGreeting(candidateName?: string | null): string {
  const name = candidateName?.trim()
  return name ? `Hello ${name},` : 'Hello,'
}

export function formatInterviewTypeLabel(type: string): string {
  if (type === 'in_person') return 'In person'
  if (type === 'online') return 'Online'
  if (type === 'phone') return 'Phone'
  return type.replace(/_/g, ' ')
}

export function formatInterviewDuration(minutes?: number | null): string | null {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return null
  const n = Math.round(minutes)
  if (n < 60) return `${n} minute${n === 1 ? '' : 's'}`
  const hours = Math.floor(n / 60)
  const rest = n % 60
  const hourLabel = `${hours} hour${hours === 1 ? '' : 's'}`
  if (rest === 0) return hourLabel
  return `${hourLabel} ${rest} minute${rest === 1 ? '' : 's'}`
}

export function formatInterviewWhen(scheduledAt: string, timezone?: string | null): string {
  const date = new Date(scheduledAt)
  if (Number.isNaN(date.getTime())) return scheduledAt
  const tz = timezone?.trim() || undefined
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }
  try {
    return date.toLocaleString('en-GB', tz ? { ...options, timeZone: tz } : options)
  } catch {
    return date.toLocaleString('en-GB', options)
  }
}
