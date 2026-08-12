/**
 * Server-authoritative screening timer helpers.
 */

export function computeExpiresAt(startedAt: Date, durationMinutes: number | null | undefined): Date {
  const minutes = durationMinutes != null && durationMinutes > 0 ? durationMinutes : 60
  return new Date(startedAt.getTime() + minutes * 60_000)
}

export function remainingMs(expiresAt: string | Date, now = new Date()): number {
  const end = typeof expiresAt === 'string' ? new Date(expiresAt).getTime() : expiresAt.getTime()
  return Math.max(0, end - now.getTime())
}

export function isSessionExpired(expiresAt: string | Date, now = new Date()): boolean {
  return remainingMs(expiresAt, now) <= 0
}

export function clampClientEventAt(
  clientEventAt: string | null | undefined,
  now = new Date()
): string | null {
  if (!clientEventAt) return null
  const t = new Date(clientEventAt)
  if (Number.isNaN(t.getTime())) return null
  // Diagnostic only — never authoritative; ignore far-future clocks
  if (t.getTime() > now.getTime() + 60_000) return now.toISOString()
  return t.toISOString()
}

export function timeSpentMs(openedAt: string | null | undefined, answeredAt: Date): number | null {
  if (!openedAt) return null
  const opened = new Date(openedAt).getTime()
  if (Number.isNaN(opened)) return null
  return Math.max(0, answeredAt.getTime() - opened)
}
