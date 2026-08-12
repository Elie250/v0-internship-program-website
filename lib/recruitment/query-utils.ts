/** Escape characters that break PostgREST .or() filter syntax. */
export function sanitizeRecruitmentSearchTerm(term: string): string {
  return term
    .trim()
    .replace(/[%_\\,().]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 120)
}

export function parsePositiveInt(value: string | null | undefined, fallback: number, max: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(parsed, max)
}
