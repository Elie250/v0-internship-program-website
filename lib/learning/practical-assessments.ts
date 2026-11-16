import { z } from 'zod'

export const PRACTICAL_MIGRATION_HINT =
  'Practical assessments need scripts/104–106 applied in Supabase (after 103 for outcome links).'

export const ASSESSMENT_KINDS = [
  'quiz',
  'laboratory',
  'practical_task',
  'project',
  'final_practical',
] as const

export type AssessmentKind = (typeof ASSESSMENT_KINDS)[number]

export const PRACTICAL_KINDS = [
  'laboratory',
  'practical_task',
  'project',
  'final_practical',
] as const

export type PracticalKind = (typeof PRACTICAL_KINDS)[number]

export const DELIVERY_MODES = [
  'not_applicable',
  'virtual_software',
  'physical_lab',
  'hybrid',
] as const

export type DeliveryMode = (typeof DELIVERY_MODES)[number]

export const PRACTICAL_STATUSES = [
  'draft',
  'submitted',
  'returned',
  'resubmitted',
  'graded',
] as const

export type PracticalStatus = (typeof PRACTICAL_STATUSES)[number]

export const ASSESSMENT_KIND_LABELS: Record<AssessmentKind, string> = {
  quiz: 'Quiz',
  laboratory: 'Laboratory',
  practical_task: 'Practical task',
  project: 'Project',
  final_practical: 'Final practical',
}

export function isPracticalKind(value: unknown): value is PracticalKind {
  return PRACTICAL_KINDS.includes(value as PracticalKind)
}

export function isAssessmentKind(value: unknown): value is AssessmentKind {
  return ASSESSMENT_KINDS.includes(value as AssessmentKind)
}

export function defaultDeliveryModeForKind(kind: AssessmentKind): DeliveryMode {
  return kind === 'quiz' ? 'not_applicable' : 'virtual_software'
}

const stringList = z
  .array(z.string().trim().max(200))
  .max(30)
  .default([])

/** Versioned practical brief. safety_notes ≠ delivery_notes. */
export const practicalBriefSchema = z.object({
  version: z.literal(1).default(1),
  learning_objectives: z.array(z.string().trim().min(1).max(500)).max(20).default([]),
  prerequisites: z.string().trim().max(4000).default(''),
  required_software: stringList,
  optional_software: stringList,
  alternative_software: stringList,
  instructions: z.string().trim().max(20_000).default(''),
  expected_results: z.string().trim().max(8000).default(''),
  simulation_requirements: z.string().trim().max(8000).default(''),
  submission_requirements: z.string().trim().max(8000).default(''),
  documentation_requirements: z.string().trim().max(8000).default(''),
  safety_notes: z.string().trim().max(4000).default(''),
  delivery_notes: z
    .string()
    .trim()
    .max(2000)
    .default(
      'No physical PLC hardware is required. Complete this assessment using the listed software and simulation tools.'
    ),
})

export type PracticalBrief = z.infer<typeof practicalBriefSchema>

export function emptyPracticalBrief(): PracticalBrief {
  return practicalBriefSchema.parse({})
}

export function parsePracticalBrief(
  raw: unknown
): { ok: true; brief: PracticalBrief } | { ok: false; error: string } {
  if (raw == null) return { ok: true, brief: emptyPracticalBrief() }
  const parsed = practicalBriefSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Invalid practical brief' }
  }
  return { ok: true, brief: parsed.data }
}

export const rubricLevelSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(''),
  points: z.number().min(0).max(10_000),
  sort_order: z.number().int().min(0).default(0),
})

export const rubricCriterionSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(4000).default(''),
    max_points: z.number().positive().max(10_000),
    sort_order: z.number().int().min(0).default(0),
    levels: z.array(rubricLevelSchema).min(1).max(12),
  })
  .superRefine((criterion, ctx) => {
    for (const level of criterion.levels) {
      if (level.points > criterion.max_points) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Level "${level.label}" exceeds max points for "${criterion.title}"`,
        })
      }
    }
  })

export const rubricInputSchema = z.object({
  title: z.string().trim().min(1).max(200).default('Marking rubric'),
  criteria: z.array(rubricCriterionSchema).min(1).max(40),
})

export type RubricInput = z.infer<typeof rubricInputSchema>

export function validateRubricForPublish(
  rubric: RubricInput | null | undefined
): { ok: true } | { ok: false; error: string } {
  if (!rubric || !rubric.criteria.length) {
    return { ok: false, error: 'Add a marking rubric with at least one criterion before publishing' }
  }
  const parsed = rubricInputSchema.safeParse(rubric)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Invalid rubric' }
  }
  return { ok: true }
}

export function canPublishPractical(input: {
  title: string
  kind: AssessmentKind
  brief: PracticalBrief
  rubric: RubricInput | null | undefined
  outcomeLinkCount: number
}): {
  ok: boolean
  error?: string
  warnings: string[]
} {
  const warnings: string[] = []
  if (!isPracticalKind(input.kind)) {
    return { ok: false, error: 'Only practical assessment kinds can use this publisher', warnings }
  }
  if (!input.title.trim()) {
    return { ok: false, error: 'Assessment title is required', warnings }
  }
  if (!input.brief.required_software.length) {
    return { ok: false, error: 'List at least one required software or tool', warnings }
  }
  if (!input.brief.instructions.trim()) {
    return { ok: false, error: 'Add step-by-step instructions before publishing', warnings }
  }
  if (!input.brief.submission_requirements.trim()) {
    return { ok: false, error: 'Describe submission requirements before publishing', warnings }
  }
  const rubricCheck = validateRubricForPublish(input.rubric)
  if (!rubricCheck.ok) return { ok: false, error: rubricCheck.error, warnings }

  if (input.outcomeLinkCount < 1) {
    warnings.push(
      'No learning outcomes are mapped yet. Publishing is allowed, but mapping outcomes is recommended.'
    )
  }
  return { ok: true, warnings }
}

export function computePracticalScore(input: {
  criterionScores: Array<{ criterionId: string; pointsAwarded: number; levelId?: string | null }>
  criteria: Array<{
    id: string
    max_points: number
    levels?: Array<{ id: string }>
  }>
}): {
  ok: true
  totalAwarded: number
  totalPossible: number
  percent: number
} | { ok: false; error: string } {
  if (!input.criteria.length) return { ok: false, error: 'Rubric criteria are required' }

  let totalAwarded = 0
  let totalPossible = 0
  const byId = new Map(input.criterionScores.map((row) => [row.criterionId, row]))
  const seen = new Set<string>()

  for (const criterion of input.criteria) {
    if (seen.has(criterion.id)) {
      return { ok: false, error: `Duplicate criterion ${criterion.id}` }
    }
    seen.add(criterion.id)
    totalPossible += Number(criterion.max_points)
    const awardedRow = byId.get(criterion.id)
    if (!awardedRow || Number.isNaN(Number(awardedRow.pointsAwarded))) {
      return { ok: false, error: `Missing score for criterion ${criterion.id}` }
    }
    const points = Number(awardedRow.pointsAwarded)
    if (points < 0 || points > Number(criterion.max_points)) {
      return {
        ok: false,
        error: `Score for criterion ${criterion.id} must be between 0 and ${criterion.max_points}`,
      }
    }
    if (awardedRow.levelId) {
      const levels = criterion.levels ?? []
      if (!levels.length) {
        return { ok: false, error: `Level selected but criterion ${criterion.id} has no levels` }
      }
      const okLevel = levels.some((level) => level.id === awardedRow.levelId)
      if (!okLevel) {
        return { ok: false, error: `Level does not belong to criterion ${criterion.id}` }
      }
    }
    totalAwarded += points
  }

  // Extra client scores for unknown criteria must not inflate the result.
  for (const row of input.criterionScores) {
    if (!seen.has(row.criterionId)) {
      return { ok: false, error: `Unknown criterion ${row.criterionId}` }
    }
  }

  if (totalPossible <= 0) return { ok: false, error: 'Rubric total points must be greater than zero' }

  const percent = Math.round((totalAwarded / totalPossible) * 100)
  return { ok: true, totalAwarded, totalPossible, percent }
}

export function passFromPercent(percent: number, passingScore: number): boolean {
  return percent >= Math.max(1, Math.min(100, Number(passingScore) || 70))
}

/** Students may revise only draft or returned work — never submitted/resubmitted/graded. */
export function studentMayEditPractical(status: PracticalStatus | null | undefined): boolean {
  return status == null || status === 'draft' || status === 'returned'
}

export function nextStatusAfterStudentSubmit(
  current: PracticalStatus | null | undefined
): PracticalStatus {
  if (current === 'returned') return 'resubmitted'
  return 'submitted'
}

export type PracticalTransitionActor = 'student' | 'lecturer'

/**
 * Explicit lifecycle transitions.
 * Student: draft→submitted, returned→resubmitted
 * Lecturer: submitted|resubmitted → returned|graded
 */
export function assertPracticalTransition(input: {
  from: PracticalStatus | null | undefined
  to: PracticalStatus
  actor: PracticalTransitionActor
}): { ok: true } | { ok: false; error: string } {
  const from = input.from ?? 'draft'
  const allowed: Record<PracticalTransitionActor, Array<[PracticalStatus, PracticalStatus]>> = {
    student: [
      ['draft', 'submitted'],
      ['returned', 'resubmitted'],
    ],
    lecturer: [
      ['submitted', 'returned'],
      ['submitted', 'graded'],
      ['resubmitted', 'returned'],
      ['resubmitted', 'graded'],
      // Re-open / re-grade already marked work
      ['graded', 'returned'],
      ['graded', 'graded'],
      ['returned', 'graded'],
      ['returned', 'returned'],
    ],
  }

  const ok = allowed[input.actor].some(([a, b]) => a === from && b === input.to)
  if (!ok) {
    return {
      ok: false,
      error: `Invalid practical status transition (${from} → ${input.to}) for ${input.actor}`,
    }
  }
  return { ok: true }
}

/** Cleared grade fields when invalidating a prior mark before resubmit. */
export const CLEARED_PRACTICAL_GRADE_FIELDS = {
  score: null,
  passed: false,
  practical_percent: null,
  graded_at: null,
  graded_by: null,
  feedback_summary: null,
  returned_at: null,
} as const

export function isMissingPracticalSchema(message: string): boolean {
  return /assessment_kind|practical_brief|assessment_rubrics|assessment_submission_artifacts|assessment_outcome_links|practical_status|resubmit_practical_submission|mark_practical_submission|schema cache|could not find the table|relation .* does not exist|Could not find the function/i.test(
    message
  )
}
