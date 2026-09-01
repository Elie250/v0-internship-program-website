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
  return formatInterviewDateTime(scheduledAt, timezone, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

export function formatInterviewWhenShort(scheduledAt: string, timezone?: string | null): string {
  return formatInterviewDateTime(scheduledAt, timezone, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatInterviewDateTime(
  scheduledAt: string,
  timezone: string | null | undefined,
  options: Intl.DateTimeFormatOptions
): string {
  const date = new Date(scheduledAt)
  if (Number.isNaN(date.getTime())) return scheduledAt
  const tz = timezone?.trim() || undefined
  try {
    return date.toLocaleString('en-GB', tz ? { ...options, timeZone: tz } : options)
  } catch {
    return date.toLocaleString('en-GB', options)
  }
}

/**
 * Interpret a datetime-local value (no offset) in the staff timezone.
 * `2026-09-03T13:00` + Africa/Kigali becomes 11:00Z, not 13:00Z.
 */
export function parseInterviewDateTime(value: string, timezone?: string | null): Date {
  const raw = String(value ?? '').trim()
  if (!raw) return new Date(NaN)
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(raw)) return new Date(raw)

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (!match) return new Date(raw)

  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] || 0),
  }
  const tz = timezone?.trim()
  if (!tz) {
    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second))
  }
  return fromZonedWallClock(parts, tz)
}

function fromZonedWallClock(
  parts: { year: number; month: number; day: number; hour: number; minute: number; second: number },
  timeZone: string
): Date {
  const utcGuess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  )
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    const shown = Object.fromEntries(
      formatter
        .formatToParts(new Date(utcGuess))
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value])
    )
    const asShown = Date.UTC(
      Number(shown.year),
      Number(shown.month) - 1,
      Number(shown.day),
      Number(shown.hour),
      Number(shown.minute),
      Number(shown.second)
    )
    return new Date(utcGuess - (asShown - utcGuess))
  } catch {
    return new Date(utcGuess)
  }
}
