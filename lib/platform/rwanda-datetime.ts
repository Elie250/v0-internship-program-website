/** Rwanda wall-clock helpers. Africa/Kigali is UTC+2 with no DST. */
export const PLATFORM_TIMEZONE = 'Africa/Kigali'
const KIGALI_OFFSET = '+02:00'

export function parsePlatformDateTime(value: string | null | undefined): Date {
  const raw = String(value ?? '').trim()
  if (!raw) return new Date(NaN)
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(raw)) return new Date(raw)

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (!match) return new Date(raw)
  return new Date(
    `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6] || '00'}${KIGALI_OFFSET}`
  )
}

export function serializePlatformDateTime(value: string | null | undefined): string | null {
  if (!String(value ?? '').trim()) return null
  const date = parsePlatformDateTime(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export function toPlatformDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PLATFORM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value
  const year = get('year')
  const month = get('month')
  const day = get('day')
  const hour = get('hour')
  const minute = get('minute')
  if (!year || !month || !day || !hour || !minute) return ''
  return `${year}-${month}-${day}T${hour}:${minute}`
}

export function formatPlatformDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-GB', {
    timeZone: PLATFORM_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
