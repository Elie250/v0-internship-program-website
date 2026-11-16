export const ACTIVITY_KINDS = [
  'theory',
  'practical',
  'exercise',
  'project',
  'assessment',
] as const

export type ActivityKind = (typeof ACTIVITY_KINDS)[number]

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  theory: 'Theory',
  practical: 'Practical',
  exercise: 'Exercise',
  project: 'Project',
  assessment: 'Assessment',
}

/** Max estimated minutes for a single curriculum activity (INT-safe, practical bound). */
export const MAX_ESTIMATED_MINUTES = 24 * 60 * 14 // two weeks of continuous study

export function isActivityKind(value: unknown): value is ActivityKind {
  return typeof value === 'string' && (ACTIVITY_KINDS as readonly string[]).includes(value)
}

/**
 * Parse admin/lecturer estimated_minutes.
 * Empty/null clears the value. Never infers from content length or media.
 */
export function parseEstimatedMinutesInput(
  value: unknown
): { ok: true; minutes: number | null } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true, minutes: null }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      return { ok: false, error: 'Estimated minutes must be a whole number.' }
    }
    if (value <= 0) return { ok: false, error: 'Estimated minutes must be a positive whole number.' }
    if (value > MAX_ESTIMATED_MINUTES) {
      return {
        ok: false,
        error: `Estimated minutes cannot exceed ${MAX_ESTIMATED_MINUTES.toLocaleString()}.`,
      }
    }
    return { ok: true, minutes: value }
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return { ok: true, minutes: null }
    if (!/^\d+$/.test(trimmed)) {
      return { ok: false, error: 'Estimated minutes must be a whole number.' }
    }
    const parsed = Number(trimmed)
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      return { ok: false, error: 'Estimated minutes must be a positive whole number.' }
    }
    if (parsed > MAX_ESTIMATED_MINUTES) {
      return {
        ok: false,
        error: `Estimated minutes cannot exceed ${MAX_ESTIMATED_MINUTES.toLocaleString()}.`,
      }
    }
    return { ok: true, minutes: parsed }
  }
  return { ok: false, error: 'Estimated minutes must be a whole number.' }
}

/**
 * Parse activity_kind. Empty/null clears. Rejects unknown labels.
 */
export function parseActivityKindInput(
  value: unknown
): { ok: true; kind: ActivityKind | null } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true, kind: null }
  if (typeof value !== 'string') {
    return { ok: false, error: 'Activity kind is invalid.' }
  }
  const trimmed = value.trim().toLowerCase()
  if (trimmed === '') return { ok: true, kind: null }
  if (!isActivityKind(trimmed)) {
    return {
      ok: false,
      error: `Activity kind must be one of: ${ACTIVITY_KINDS.join(', ')}.`,
    }
  }
  return { ok: true, kind: trimmed }
}

export function parseCurriculumWorkloadFields(input: {
  estimatedMinutes?: unknown
  activityKind?: unknown
  /** When false, omitted fields are left unset (partial updates). */
  requirePresence?: boolean
}):
  | { ok: true; estimatedMinutes?: number | null; activityKind?: ActivityKind | null }
  | { ok: false; error: string } {
  const result: { estimatedMinutes?: number | null; activityKind?: ActivityKind | null } = {}

  if (input.requirePresence || input.estimatedMinutes !== undefined) {
    const minutes = parseEstimatedMinutesInput(input.estimatedMinutes)
    if (!minutes.ok) return minutes
    result.estimatedMinutes = minutes.minutes
  }

  if (input.requirePresence || input.activityKind !== undefined) {
    const kind = parseActivityKindInput(input.activityKind)
    if (!kind.ok) return kind
    result.activityKind = kind.kind
  }

  return { ok: true, ...result }
}

/**
 * Phase 2 helper: planned release calendar day from admission (day_index 1 = admission day).
 * Uses consecutive calendar days including weekends. Does not generate schedules in Phase 1.
 */
export function plannedReleaseDateFromAdmission(
  admissionAt: Date,
  dayIndex: number,
  timeZone = 'Africa/Kigali'
): { ok: true; isoDate: string } | { ok: false; error: string } {
  if (!Number.isInteger(dayIndex) || dayIndex < 1) {
    return { ok: false, error: 'dayIndex must be a positive integer starting at 1.' }
  }
  if (Number.isNaN(admissionAt.getTime())) {
    return { ok: false, error: 'admissionAt must be a valid date.' }
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const base = formatter.format(admissionAt) // YYYY-MM-DD in platform TZ
  const [y, m, d] = base.split('-').map(Number)
  const utcNoon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  utcNoon.setUTCDate(utcNoon.getUTCDate() + (dayIndex - 1))
  const isoDate = utcNoon.toISOString().slice(0, 10)
  return { ok: true, isoDate }
}
