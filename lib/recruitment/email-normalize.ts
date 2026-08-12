/**
 * Normalize recruitment login emails consistently (trim + lowercase).
 * Used for lookup, insert, and rate-limit buckets — not Academy registration.
 */
export function normalizeRecruitmentEmail(raw: string): string | null {
  const normalized = raw.trim().toLowerCase()
  if (!normalized) return null
  // Practical validation: local@domain.tld without spaces
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null
  return normalized
}
