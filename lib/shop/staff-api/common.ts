import { z } from 'zod'

export const BUSINESS_TIMEZONE = 'Africa/Kigali'

export function parsePagination(searchParams: URLSearchParams): {
  page: number
  limit: number
  offset: number
} {
  const pageRaw = Number(searchParams.get('page') ?? '1')
  const limitRaw = Number(searchParams.get('limit') ?? '25')
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1
  const limit = Number.isFinite(limitRaw)
    ? Math.min(100, Math.max(1, Math.floor(limitRaw)))
    : 25
  return { page, limit, offset: (page - 1) * limit }
}

export function paginatedResponse<T>(input: {
  items: T[]
  page: number
  limit: number
  total: number
}) {
  return {
    items: input.items,
    page: input.page,
    limit: input.limit,
    total: input.total,
  }
}

export function parseOptionalUuid(value: string | null): string | null {
  if (!value) return null
  const parsed = z.string().uuid().safeParse(value)
  return parsed.success ? parsed.data : null
}

export function parseOptionalDate(value: string | null): string | null {
  if (!value) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  return value
}

/** Calendar YYYY-MM-DD in Africa/Kigali for a given instant. */
export function kigaliCalendarDate(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * UTC bounds for the Kigali calendar day containing `date`.
 * Kigali is UTC+2 year-round (no DST).
 */
export function kigaliDayUtcBounds(date = new Date()): { startIso: string; endIso: string } {
  const day = kigaliCalendarDate(date)
  const startIso = new Date(`${day}T00:00:00+02:00`).toISOString()
  const endIso = new Date(`${day}T23:59:59.999+02:00`).toISOString()
  return { startIso, endIso }
}

/** Inclusive Kigali calendar-date range → UTC ISO bounds. */
export function kigaliDateFilterBounds(
  dateFrom: string | null,
  dateTo: string | null
): { startIso: string | null; endIso: string | null } {
  return {
    startIso: dateFrom ? new Date(`${dateFrom}T00:00:00+02:00`).toISOString() : null,
    endIso: dateTo ? new Date(`${dateTo}T23:59:59.999+02:00`).toISOString() : null,
  }
}

/** Sanitize free-text for PostgREST ilike / or() filters. */
export function sanitizeSearchTerm(value: string, maxLen = 80): string {
  return value
    .replace(/[%_,.()\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen)
}

export function staffApiError(status: number, error: string) {
  return Response.json({ error }, { status })
}
