export const PROGRAM_TYPES = [
  'training',
  'internship',
  'mentorship',
  'career_guidance',
  'workshop',
  'webinar',
  'event',
] as const

export type ProgramType = (typeof PROGRAM_TYPES)[number]

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  training: 'Training',
  internship: 'Internship',
  mentorship: 'Mentorship',
  career_guidance: 'Career guidance',
  workshop: 'Workshop',
  webinar: 'Public webinar',
  event: 'Event',
}

export const STUDENT_TRACKS = [
  { id: 'training', label: 'Training', types: ['training'] as ProgramType[] },
  { id: 'internship', label: 'Internship', types: ['internship'] as ProgramType[] },
  {
    id: 'career',
    label: 'Career & events',
    types: ['mentorship', 'career_guidance', 'workshop', 'webinar', 'event'] as ProgramType[],
  },
] as const

export type StudentTrackId = (typeof STUDENT_TRACKS)[number]['id']

export const CAREER_PROGRAM_TYPES: ProgramType[] = [
  'mentorship',
  'career_guidance',
  'workshop',
  'webinar',
  'event',
]

export function normalizeProgramType(value: unknown): ProgramType {
  const raw = String(value ?? 'training').trim().toLowerCase()
  if (PROGRAM_TYPES.includes(raw as ProgramType)) return raw as ProgramType
  return 'training'
}

export function isFreeProgram(pricing: number | null | undefined): boolean {
  return Number(pricing ?? 0) <= 0
}

export function programTypeNeedsSchedule(type: ProgramType): boolean {
  return type === 'webinar' || type === 'workshop' || type === 'event'
}

export function programTypeNeedsMeetingLink(type: ProgramType): boolean {
  return type === 'webinar'
}

export function programTypeNeedsLocation(type: ProgramType): boolean {
  return type === 'workshop' || type === 'event'
}
