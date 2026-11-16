import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  ASSESSMENT_KIND_LABELS,
  PRACTICAL_MIGRATION_HINT,
  assertPracticalTransition,
  canPublishPractical,
  computePracticalScore,
  defaultDeliveryModeForKind,
  emptyPracticalBrief,
  isMissingPracticalSchema,
  isPracticalKind,
  nextStatusAfterStudentSubmit,
  parsePracticalBrief,
  passFromPercent,
  studentMayEditPractical,
  type AssessmentKind,
  type DeliveryMode,
  type PracticalBrief,
  type PracticalKind,
  type PracticalStatus,
  type RubricInput,
} from '@/lib/learning/practical-assessments'
import { isAuthorizedPracticalStorageKey } from '@/lib/learning/practical-upload'
import { createSignedGetUrl } from '@/lib/storage/object-storage'

export type PracticalRubricLevel = {
  id: string
  label: string
  description: string
  points: number
  sort_order: number
}

export type PracticalRubricCriterion = {
  id: string
  title: string
  description: string
  max_points: number
  sort_order: number
  levels: PracticalRubricLevel[]
}

export type PracticalRubric = {
  id: string
  title: string
  criteria: PracticalRubricCriterion[]
}

export type PracticalAssessmentRecord = {
  id: string
  course_id: string
  title: string
  description: string | null
  passing_score: number
  sort_order: number
  is_published: boolean
  due_at: string | null
  estimated_minutes: number | null
  activity_kind: string | null
  assessment_kind: PracticalKind
  delivery_mode: DeliveryMode
  practical_brief: PracticalBrief
  rubric: PracticalRubric | null
  outcome_ids: string[]
  kind_label: string
}

function missingSchemaError(message: string): string {
  if (isMissingPracticalSchema(message)) return PRACTICAL_MIGRATION_HINT
  return message
}

function isMissingPracticalRpc(message: string): boolean {
  return /Could not find the function|function .* does not exist|schema cache/i.test(message)
}

function isConcurrentPracticalConflict(message: string): boolean {
  return /Concurrent modification|status changed concurrently|must be returned before resubmit|Invalid practical status transition/i.test(
    message
  )
}

/** Student-safe error; logs diagnostics server-side. */
function mapPracticalRpcFailure(input: {
  operation: 'resubmit' | 'mark'
  submissionId: string
  rpcMessage: string
}): string {
  const missing = isMissingPracticalRpc(input.rpcMessage)
  console.error(`[practical-${input.operation}] rpc failed`, {
    submissionId: input.submissionId,
    missingFunction: missing,
    detail: input.rpcMessage.slice(0, 400),
  })

  if (missing) {
    return input.operation === 'resubmit'
      ? `${PRACTICAL_MIGRATION_HINT} Resubmission requires the database function resubmit_practical_submission.`
      : `${PRACTICAL_MIGRATION_HINT} Marking requires the database function mark_practical_submission.`
  }
  if (isConcurrentPracticalConflict(input.rpcMessage)) {
    return 'Submission changed concurrently; refresh and try again'
  }
  return input.operation === 'resubmit'
    ? 'Could not resubmit this practical. Please refresh and try again.'
    : 'Could not save marking. Please refresh and try again.'
}

async function loadRubric(assessmentId: string): Promise<PracticalRubric | null> {
  if (!supabaseAdmin) return null
  const { data: rubric, error } = await supabaseAdmin
    .from('assessment_rubrics')
    .select('id, title')
    .eq('assessment_id', assessmentId)
    .maybeSingle()
  if (error) throw new Error(missingSchemaError(error.message))
  if (!rubric) return null

  const { data: criteria, error: criteriaError } = await supabaseAdmin
    .from('assessment_rubric_criteria')
    .select('id, title, description, max_points, sort_order')
    .eq('rubric_id', rubric.id)
    .order('sort_order', { ascending: true })
  if (criteriaError) throw new Error(missingSchemaError(criteriaError.message))

  const criterionIds = (criteria ?? []).map((row) => String(row.id))
  let levels: Array<Record<string, unknown>> = []
  if (criterionIds.length) {
    const { data, error: levelsError } = await supabaseAdmin
      .from('assessment_rubric_levels')
      .select('id, criterion_id, label, description, points, sort_order')
      .in('criterion_id', criterionIds)
      .order('sort_order', { ascending: true })
    if (levelsError) throw new Error(missingSchemaError(levelsError.message))
    levels = (data ?? []) as Array<Record<string, unknown>>
  }

  const levelsByCriterion = new Map<string, PracticalRubricLevel[]>()
  for (const level of levels) {
    const criterionId = String(level.criterion_id)
    const list = levelsByCriterion.get(criterionId) ?? []
    list.push({
      id: String(level.id),
      label: String(level.label),
      description: String(level.description ?? ''),
      points: Number(level.points),
      sort_order: Number(level.sort_order ?? 0),
    })
    levelsByCriterion.set(criterionId, list)
  }

  return {
    id: String(rubric.id),
    title: String(rubric.title),
    criteria: (criteria ?? []).map((row) => ({
      id: String(row.id),
      title: String(row.title),
      description: String(row.description ?? ''),
      max_points: Number(row.max_points),
      sort_order: Number(row.sort_order ?? 0),
      levels: levelsByCriterion.get(String(row.id)) ?? [],
    })),
  }
}

async function loadOutcomeIds(assessmentId: string): Promise<string[]> {
  if (!supabaseAdmin) return []
  const { data, error } = await supabaseAdmin
    .from('assessment_outcome_links')
    .select('outcome_id')
    .eq('assessment_id', assessmentId)
    .is('criterion_id', null)
  if (error) {
    if (isMissingPracticalSchema(error.message)) return []
    throw new Error(missingSchemaError(error.message))
  }
  return (data ?? []).map((row) => String(row.outcome_id))
}

function mapAssessmentRow(
  row: Record<string, unknown>,
  rubric: PracticalRubric | null,
  outcomeIds: string[]
): PracticalAssessmentRecord {
  const kind = String(row.assessment_kind) as PracticalKind
  const briefParsed = parsePracticalBrief(row.practical_brief)
  return {
    id: String(row.id),
    course_id: String(row.course_id),
    title: String(row.title),
    description: (row.description as string | null) ?? null,
    passing_score: Number(row.passing_score ?? 70),
    sort_order: Number(row.sort_order ?? 0),
    is_published: row.is_published !== false,
    due_at: (row.due_at as string | null) ?? null,
    estimated_minutes: row.estimated_minutes == null ? null : Number(row.estimated_minutes),
    activity_kind: (row.activity_kind as string | null) ?? null,
    assessment_kind: kind,
    delivery_mode: String(row.delivery_mode || 'virtual_software') as DeliveryMode,
    practical_brief: briefParsed.ok ? briefParsed.brief : emptyPracticalBrief(),
    rubric,
    outcome_ids: outcomeIds,
    kind_label: ASSESSMENT_KIND_LABELS[kind] ?? kind,
  }
}

export async function listPracticalAssessments(
  courseId: string,
  opts?: { publishedOnly?: boolean }
): Promise<{ assessments: PracticalAssessmentRecord[]; error?: string }> {
  if (!supabaseAdmin) return { assessments: [], error: 'Database not configured' }

  let query = supabaseAdmin
    .from('course_assessments')
    .select(
      'id, course_id, title, description, passing_score, sort_order, is_published, due_at, estimated_minutes, activity_kind, assessment_kind, delivery_mode, practical_brief'
    )
    .eq('course_id', courseId)
    .neq('assessment_kind', 'quiz')
    .order('sort_order', { ascending: true })

  const { data, error } = await query
  if (error) return { assessments: [], error: missingSchemaError(error.message) }

  let rows = (data ?? []) as Array<Record<string, unknown>>
  if (opts?.publishedOnly) rows = rows.filter((row) => row.is_published !== false)

  const assessments: PracticalAssessmentRecord[] = []
  for (const row of rows) {
    if (!isPracticalKind(row.assessment_kind)) continue
    const rubric = await loadRubric(String(row.id))
    const outcomeIds = await loadOutcomeIds(String(row.id))
    assessments.push(mapAssessmentRow(row, rubric, outcomeIds))
  }
  return { assessments }
}

export async function getPracticalAssessment(
  assessmentId: string,
  opts?: { courseId?: string }
): Promise<{ assessment: PracticalAssessmentRecord | null; error?: string }> {
  if (!supabaseAdmin) return { assessment: null, error: 'Database not configured' }

  let query = supabaseAdmin
    .from('course_assessments')
    .select(
      'id, course_id, title, description, passing_score, sort_order, is_published, due_at, estimated_minutes, activity_kind, assessment_kind, delivery_mode, practical_brief'
    )
    .eq('id', assessmentId)

  if (opts?.courseId) query = query.eq('course_id', opts.courseId)

  const { data, error } = await query.maybeSingle()
  if (error) return { assessment: null, error: missingSchemaError(error.message) }
  if (!data || !isPracticalKind(data.assessment_kind)) return { assessment: null }

  const rubric = await loadRubric(String(data.id))
  const outcomeIds = await loadOutcomeIds(String(data.id))
  return { assessment: mapAssessmentRow(data as Record<string, unknown>, rubric, outcomeIds) }
}

async function assessmentHasLockedPracticalWork(assessmentId: string): Promise<boolean> {
  if (!supabaseAdmin) return false
  const { data, error } = await supabaseAdmin
    .from('assessment_submissions')
    .select('id')
    .eq('assessment_id', assessmentId)
    .in('practical_status', ['submitted', 'returned', 'resubmitted', 'graded'])
    .limit(1)
  if (error) {
    if (isMissingPracticalSchema(error.message)) return false
    throw new Error(missingSchemaError(error.message))
  }
  return Boolean(data?.length)
}

async function replaceRubric(assessmentId: string, rubric: RubricInput): Promise<void> {
  if (!supabaseAdmin) throw new Error('Database not configured')

  // Deleting a rubric cascades to criteria/levels and criterion scores — refuse after real submissions.
  if (await assessmentHasLockedPracticalWork(assessmentId)) {
    throw new Error(
      'Cannot replace the marking rubric after students have submitted work. Historical criterion scores would be lost.'
    )
  }

  await supabaseAdmin.from('assessment_rubrics').delete().eq('assessment_id', assessmentId)

  const { data: created, error } = await supabaseAdmin
    .from('assessment_rubrics')
    .insert({
      assessment_id: assessmentId,
      title: rubric.title,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error || !created) throw new Error(missingSchemaError(error?.message || 'Could not save rubric'))

  for (let i = 0; i < rubric.criteria.length; i++) {
    const criterion = rubric.criteria[i]
    const { data: criterionRow, error: criterionError } = await supabaseAdmin
      .from('assessment_rubric_criteria')
      .insert({
        rubric_id: created.id,
        title: criterion.title,
        description: criterion.description ?? '',
        max_points: criterion.max_points,
        sort_order: criterion.sort_order ?? i,
      })
      .select('id')
      .single()
    if (criterionError || !criterionRow) {
      throw new Error(missingSchemaError(criterionError?.message || 'Could not save criterion'))
    }

    const levelRows = criterion.levels.map((level, index) => ({
      criterion_id: criterionRow.id,
      label: level.label,
      description: level.description ?? '',
      points: level.points,
      sort_order: level.sort_order ?? index,
    }))
    const { error: levelsError } = await supabaseAdmin.from('assessment_rubric_levels').insert(levelRows)
    if (levelsError) throw new Error(missingSchemaError(levelsError.message))
  }
}

async function replaceOutcomeLinks(assessmentId: string, outcomeIds: string[]): Promise<void> {
  if (!supabaseAdmin) throw new Error('Database not configured')
  await supabaseAdmin.from('assessment_outcome_links').delete().eq('assessment_id', assessmentId)
  const unique = [...new Set(outcomeIds.map(String).filter(Boolean))]
  if (!unique.length) return
  const { error } = await supabaseAdmin.from('assessment_outcome_links').insert(
    unique.map((outcome_id) => ({
      assessment_id: assessmentId,
      outcome_id,
      criterion_id: null,
    }))
  )
  if (error) throw new Error(missingSchemaError(error.message))
}

export async function createPracticalAssessment(input: {
  courseId: string
  createdBy: string
  title: string
  description?: string | null
  kind: PracticalKind
  passingScore?: number
  dueAt?: string | null
  estimatedMinutes?: number | null
  activityKind?: string | null
  brief?: unknown
  rubric?: RubricInput | null
  outcomeIds?: string[]
  publish?: boolean
}): Promise<
  | { ok: true; assessment: PracticalAssessmentRecord; warnings: string[] }
  | { ok: false; error: string }
> {
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured' }
  if (!isPracticalKind(input.kind)) return { ok: false, error: 'Invalid practical assessment kind' }

  const briefParsed = parsePracticalBrief(input.brief ?? emptyPracticalBrief())
  if (!briefParsed.ok) return { ok: false, error: briefParsed.error }

  const publish = input.publish === true
  const warnings: string[] = []
  if (publish) {
    const gate = canPublishPractical({
      title: input.title,
      kind: input.kind,
      brief: briefParsed.brief,
      rubric: input.rubric ?? null,
      outcomeLinkCount: input.outcomeIds?.length ?? 0,
    })
    if (!gate.ok) return { ok: false, error: gate.error || 'Cannot publish' }
    warnings.push(...gate.warnings)
  } else if ((input.outcomeIds?.length ?? 0) < 1) {
    warnings.push('Map learning outcomes before publishing when ready.')
  }

  const { data: maxSort } = await supabaseAdmin
    .from('course_assessments')
    .select('sort_order')
    .eq('course_id', input.courseId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await supabaseAdmin
    .from('course_assessments')
    .insert({
      course_id: input.courseId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      passing_score: Math.max(1, Math.min(100, Number(input.passingScore) || 70)),
      sort_order: Number(maxSort?.sort_order ?? 0) + 1,
      is_published: publish,
      created_by: input.createdBy,
      due_at: input.dueAt || null,
      estimated_minutes: input.estimatedMinutes ?? null,
      activity_kind: input.activityKind ?? 'practical',
      assessment_kind: input.kind,
      delivery_mode: defaultDeliveryModeForKind(input.kind),
      practical_brief: briefParsed.brief,
    })
    .select(
      'id, course_id, title, description, passing_score, sort_order, is_published, due_at, estimated_minutes, activity_kind, assessment_kind, delivery_mode, practical_brief'
    )
    .single()

  if (error || !data) return { ok: false, error: missingSchemaError(error?.message || 'Create failed') }

  try {
    if (input.rubric) await replaceRubric(String(data.id), input.rubric)
    if (input.outcomeIds?.length) await replaceOutcomeLinks(String(data.id), input.outcomeIds)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to save rubric/outcomes' }
  }

  const loaded = await getPracticalAssessment(String(data.id), { courseId: input.courseId })
  if (!loaded.assessment) return { ok: false, error: loaded.error || 'Created but failed to reload' }
  return { ok: true, assessment: loaded.assessment, warnings }
}

export async function updatePracticalAssessment(input: {
  courseId: string
  assessmentId: string
  title?: string
  description?: string | null
  kind?: PracticalKind
  passingScore?: number
  dueAt?: string | null
  estimatedMinutes?: number | null
  activityKind?: string | null
  brief?: unknown
  rubric?: RubricInput | null
  outcomeIds?: string[]
  isPublished?: boolean
}): Promise<
  | { ok: true; assessment: PracticalAssessmentRecord; warnings: string[] }
  | { ok: false; error: string }
> {
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured' }

  const existing = await getPracticalAssessment(input.assessmentId, { courseId: input.courseId })
  if (!existing.assessment) return { ok: false, error: existing.error || 'Assessment not found' }

  const kind = input.kind ?? existing.assessment.assessment_kind
  if (!isPracticalKind(kind)) return { ok: false, error: 'Invalid practical assessment kind' }

  const briefParsed = parsePracticalBrief(input.brief ?? existing.assessment.practical_brief)
  if (!briefParsed.ok) return { ok: false, error: briefParsed.error }

  const rubricInput = input.rubric === undefined
    ? existing.assessment.rubric
      ? {
          title: existing.assessment.rubric.title,
          criteria: existing.assessment.rubric.criteria.map((c) => ({
            title: c.title,
            description: c.description,
            max_points: c.max_points,
            sort_order: c.sort_order,
            levels: c.levels.map((l) => ({
              label: l.label,
              description: l.description,
              points: l.points,
              sort_order: l.sort_order,
            })),
          })),
        }
      : null
    : input.rubric

  const outcomeIds = input.outcomeIds ?? existing.assessment.outcome_ids
  const willPublish = input.isPublished === true || (input.isPublished !== false && existing.assessment.is_published)
  const warnings: string[] = []

  if (willPublish) {
    const gate = canPublishPractical({
      title: input.title ?? existing.assessment.title,
      kind,
      brief: briefParsed.brief,
      rubric: rubricInput,
      outcomeLinkCount: outcomeIds.length,
    })
    if (!gate.ok) return { ok: false, error: gate.error || 'Cannot publish' }
    warnings.push(...gate.warnings)
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    assessment_kind: kind,
    delivery_mode: defaultDeliveryModeForKind(kind),
    practical_brief: briefParsed.brief,
  }
  if (input.title != null) patch.title = input.title.trim()
  if (input.description !== undefined) patch.description = input.description?.trim() || null
  if (input.passingScore != null) {
    patch.passing_score = Math.max(1, Math.min(100, Number(input.passingScore) || 70))
  }
  if (input.dueAt !== undefined) patch.due_at = input.dueAt || null
  if (input.estimatedMinutes !== undefined) patch.estimated_minutes = input.estimatedMinutes
  if (input.activityKind !== undefined) patch.activity_kind = input.activityKind
  if (input.isPublished !== undefined) patch.is_published = input.isPublished

  const { error } = await supabaseAdmin
    .from('course_assessments')
    .update(patch)
    .eq('id', input.assessmentId)
    .eq('course_id', input.courseId)
  if (error) return { ok: false, error: missingSchemaError(error.message) }

  try {
    if (input.rubric) await replaceRubric(input.assessmentId, input.rubric)
    if (input.outcomeIds) await replaceOutcomeLinks(input.assessmentId, input.outcomeIds)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to save rubric/outcomes' }
  }

  const loaded = await getPracticalAssessment(input.assessmentId, { courseId: input.courseId })
  if (!loaded.assessment) return { ok: false, error: loaded.error || 'Updated but failed to reload' }
  return { ok: true, assessment: loaded.assessment, warnings }
}

export type PracticalSubmissionRecord = {
  id: string
  assessment_id: string
  enrollment_id: string
  user_id: string | null
  score: number | null
  passed: boolean
  practical_status: PracticalStatus | null
  student_notes: string | null
  feedback_summary: string | null
  practical_percent: number | null
  graded_at: string | null
  returned_at: string | null
  submitted_at: string | null
  artifacts: Array<{
    id: string
    file_url: string
    file_name: string
    content_type: string
    byte_size: number
    label: string
    storage_key: string | null
    sort_order: number
  }>
  criterion_scores: Array<{
    criterion_id: string
    level_id: string | null
    points_awarded: number
    comment: string
  }>
}

async function loadSubmissionExtras(submissionId: string): Promise<{
  artifacts: PracticalSubmissionRecord['artifacts']
  criterion_scores: PracticalSubmissionRecord['criterion_scores']
}> {
  if (!supabaseAdmin) return { artifacts: [], criterion_scores: [] }

  const [{ data: artifacts }, { data: scores }] = await Promise.all([
    supabaseAdmin
      .from('assessment_submission_artifacts')
      .select('id, file_url, file_name, content_type, byte_size, label, storage_key, sort_order')
      .eq('submission_id', submissionId)
      .order('sort_order', { ascending: true }),
    supabaseAdmin
      .from('assessment_criterion_scores')
      .select('criterion_id, level_id, points_awarded, comment')
      .eq('submission_id', submissionId),
  ])

  return {
    artifacts: (artifacts ?? []).map((row) => ({
      id: String(row.id),
      file_url: String(row.file_url ?? ''),
      file_name: String(row.file_name),
      content_type: String(row.content_type ?? 'application/octet-stream'),
      byte_size: Number(row.byte_size ?? 0),
      label: String(row.label ?? ''),
      storage_key: row.storage_key ? String(row.storage_key) : null,
      sort_order: Number(row.sort_order ?? 0),
    })),
    criterion_scores: (scores ?? []).map((row) => ({
      criterion_id: String(row.criterion_id),
      level_id: row.level_id ? String(row.level_id) : null,
      points_awarded: Number(row.points_awarded),
      comment: String(row.comment ?? ''),
    })),
  }
}

export async function getStudentPracticalSubmission(input: {
  assessmentId: string
  enrollmentId: string
}): Promise<{ submission: PracticalSubmissionRecord | null; error?: string }> {
  if (!supabaseAdmin) return { submission: null, error: 'Database not configured' }

  const { data: existing, error } = await supabaseAdmin
    .from('assessment_submissions')
    .select(
      'id, assessment_id, enrollment_id, user_id, score, passed, practical_status, student_notes, feedback_summary, practical_percent, graded_at, returned_at, submitted_at'
    )
    .eq('assessment_id', input.assessmentId)
    .eq('enrollment_id', input.enrollmentId)
    .maybeSingle()

  if (error) return { submission: null, error: missingSchemaError(error.message) }
  if (!existing) return { submission: null }

  const extras = await loadSubmissionExtras(String(existing.id))
  return { submission: mapSubmission(existing as Record<string, unknown>, extras) }
}

function mapSubmission(
  row: Record<string, unknown>,
  extras: {
    artifacts: PracticalSubmissionRecord['artifacts']
    criterion_scores: PracticalSubmissionRecord['criterion_scores']
  }
): PracticalSubmissionRecord {
  return {
    id: String(row.id),
    assessment_id: String(row.assessment_id),
    enrollment_id: String(row.enrollment_id),
    user_id: row.user_id ? String(row.user_id) : null,
    score: row.score == null ? null : Number(row.score),
    passed: Boolean(row.passed),
    practical_status: (row.practical_status as PracticalStatus | null) ?? null,
    student_notes: (row.student_notes as string | null) ?? null,
    feedback_summary: (row.feedback_summary as string | null) ?? null,
    practical_percent: row.practical_percent == null ? null : Number(row.practical_percent),
    graded_at: (row.graded_at as string | null) ?? null,
    returned_at: (row.returned_at as string | null) ?? null,
    submitted_at: (row.submitted_at as string | null) ?? null,
    artifacts: extras.artifacts,
    criterion_scores: extras.criterion_scores,
  }
}

export async function ensureStudentPracticalDraft(input: {
  assessmentId: string
  enrollmentId: string
  userId: string
}): Promise<{ submission: PracticalSubmissionRecord; error?: string }> {
  if (!supabaseAdmin) return { submission: null as never, error: 'Database not configured' }

  const existing = await getStudentPracticalSubmission({
    assessmentId: input.assessmentId,
    enrollmentId: input.enrollmentId,
  })
  if (existing.error) return { submission: null as never, error: existing.error }
  if (existing.submission) return { submission: existing.submission }

  const { data: created, error: createError } = await supabaseAdmin
    .from('assessment_submissions')
    .insert({
      assessment_id: input.assessmentId,
      enrollment_id: input.enrollmentId,
      user_id: input.userId,
      practical_status: 'draft',
      passed: false,
      score: null,
    })
    .select(
      'id, assessment_id, enrollment_id, user_id, score, passed, practical_status, student_notes, feedback_summary, practical_percent, graded_at, returned_at, submitted_at'
    )
    .single()

  if (createError || !created) {
    return { submission: null as never, error: missingSchemaError(createError?.message || 'Create failed') }
  }
  return {
    submission: mapSubmission(created as Record<string, unknown>, {
      artifacts: [],
      criterion_scores: [],
    }),
  }
}

/** @deprecated Prefer getStudentPracticalSubmission / ensureStudentPracticalDraft */
export async function getOrCreateStudentPracticalSubmission(input: {
  assessmentId: string
  enrollmentId: string
  userId: string
}): Promise<{ submission: PracticalSubmissionRecord; error?: string }> {
  return ensureStudentPracticalDraft(input)
}

async function replaceSubmissionArtifacts(input: {
  submissionId: string
  courseId: string
  assessmentId: string
  userId: string
  artifacts: Array<{
    storage_key: string
    file_name: string
    content_type: string
    byte_size: number
    label?: string
  }>
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured' }

  for (const artifact of input.artifacts) {
    if (
      !isAuthorizedPracticalStorageKey(artifact.storage_key, {
        courseId: input.courseId,
        assessmentId: input.assessmentId,
        userId: input.userId,
      })
    ) {
      return { ok: false, error: 'Invalid or unauthorized storage key for artifact' }
    }
  }

  const { error: delError } = await supabaseAdmin
    .from('assessment_submission_artifacts')
    .delete()
    .eq('submission_id', input.submissionId)
  if (delError) return { ok: false, error: missingSchemaError(delError.message) }

  if (!input.artifacts.length) return { ok: true }

  const { error: artError } = await supabaseAdmin.from('assessment_submission_artifacts').insert(
    input.artifacts.map((artifact, index) => ({
      submission_id: input.submissionId,
      // Durable reference is storage_key; file_url kept non-empty for NOT NULL column compatibility.
      file_url: `storage://${artifact.storage_key}`,
      file_name: artifact.file_name,
      content_type: artifact.content_type,
      byte_size: artifact.byte_size,
      label: artifact.label ?? '',
      storage_key: artifact.storage_key,
      sort_order: index,
    }))
  )
  if (artError) return { ok: false, error: missingSchemaError(artError.message) }
  return { ok: true }
}

export async function saveStudentPracticalDraft(input: {
  submissionId: string
  courseId: string
  assessmentId: string
  userId: string
  studentNotes?: string | null
  artifacts?: Array<{
    storage_key: string
    file_name: string
    content_type: string
    byte_size: number
    label?: string
  }>
  replaceArtifacts?: boolean
}): Promise<{ ok: true; submission: PracticalSubmissionRecord } | { ok: false; error: string }> {
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured' }

  const { data: row, error } = await supabaseAdmin
    .from('assessment_submissions')
    .select(
      'id, assessment_id, enrollment_id, user_id, score, passed, practical_status, student_notes, feedback_summary, practical_percent, graded_at, returned_at, submitted_at'
    )
    .eq('id', input.submissionId)
    .maybeSingle()
  if (error || !row) return { ok: false, error: missingSchemaError(error?.message || 'Submission not found') }

  const status = (row.practical_status as PracticalStatus | null) ?? 'draft'
  if (!studentMayEditPractical(status)) {
    return { ok: false, error: 'This submission can no longer be edited' }
  }

  // Keep status as draft or returned while revising — never jump to resubmitted on save.
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('assessment_submissions')
    .update({
      student_notes: input.studentNotes ?? row.student_notes,
      practical_status: status === 'returned' ? 'returned' : 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.submissionId)
    .eq('practical_status', status)
    .select('id')
    .maybeSingle()
  if (updateError) return { ok: false, error: missingSchemaError(updateError.message) }
  if (!updated) return { ok: false, error: 'Submission changed concurrently; refresh and try again' }

  if (input.replaceArtifacts && input.artifacts) {
    const replaced = await replaceSubmissionArtifacts({
      submissionId: input.submissionId,
      courseId: input.courseId,
      assessmentId: input.assessmentId,
      userId: input.userId,
      artifacts: input.artifacts,
    })
    if (!replaced.ok) return replaced
  }

  const reloaded = await getStudentPracticalSubmission({
    assessmentId: String(row.assessment_id),
    enrollmentId: String(row.enrollment_id),
  })
  if (reloaded.error || !reloaded.submission) {
    return { ok: false, error: reloaded.error || 'Failed to reload submission' }
  }
  return { ok: true, submission: reloaded.submission }
}

export async function submitStudentPractical(input: {
  submissionId: string
  courseId: string
  assessmentId: string
  userId: string
  studentNotes?: string | null
  artifacts?: Array<{
    storage_key: string
    file_name: string
    content_type: string
    byte_size: number
    label?: string
  }>
}): Promise<{ ok: true; submission: PracticalSubmissionRecord } | { ok: false; error: string }> {
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured' }

  const { data: row, error } = await supabaseAdmin
    .from('assessment_submissions')
    .select(
      'id, assessment_id, enrollment_id, user_id, score, passed, practical_status, student_notes, feedback_summary, practical_percent, graded_at, returned_at, submitted_at'
    )
    .eq('id', input.submissionId)
    .maybeSingle()
  if (error || !row) return { ok: false, error: missingSchemaError(error?.message || 'Submission not found') }

  const status = (row.practical_status as PracticalStatus | null) ?? 'draft'
  if (!studentMayEditPractical(status)) {
    return { ok: false, error: 'This submission cannot be submitted in its current status' }
  }

  const nextStatus = nextStatusAfterStudentSubmit(status)
  const transition = assertPracticalTransition({ from: status, to: nextStatus, actor: 'student' })
  if (!transition.ok) return { ok: false, error: transition.error }

  // Persist latest notes/artifacts while still in an editable state.
  if (input.artifacts) {
    const replaced = await replaceSubmissionArtifacts({
      submissionId: input.submissionId,
      courseId: input.courseId,
      assessmentId: input.assessmentId,
      userId: input.userId,
      artifacts: input.artifacts,
    })
    if (!replaced.ok) return replaced
  }

  const extras = await loadSubmissionExtras(input.submissionId)
  if (!extras.artifacts.length) {
    return { ok: false, error: 'Upload at least one evidence file before submitting' }
  }

  if (status === 'returned') {
    // Fail closed: only the transactional RPC may clear grades + flip status.
    // No multi-step client fallback — preserves returned submission and scores on failure.
    const { error: rpcError } = await supabaseAdmin.rpc('resubmit_practical_submission', {
      p_submission_id: input.submissionId,
      p_student_notes: input.studentNotes ?? row.student_notes,
    })
    if (rpcError) {
      return {
        ok: false,
        error: mapPracticalRpcFailure({
          operation: 'resubmit',
          submissionId: input.submissionId,
          rpcMessage: rpcError.message,
        }),
      }
    }
  } else {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('assessment_submissions')
      .update({
        student_notes: input.studentNotes ?? row.student_notes,
        practical_status: nextStatus,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.submissionId)
      .eq('practical_status', status)
      .select('id')
      .maybeSingle()
    if (updateError) return { ok: false, error: missingSchemaError(updateError.message) }
    if (!updated) return { ok: false, error: 'Submission changed concurrently; refresh and try again' }
  }

  const reloaded = await getStudentPracticalSubmission({
    assessmentId: String(row.assessment_id),
    enrollmentId: String(row.enrollment_id),
  })
  if (reloaded.error || !reloaded.submission) {
    return { ok: false, error: reloaded.error || 'Failed to reload submission' }
  }
  if (reloaded.submission.practical_status !== nextStatus) {
    return { ok: false, error: 'Submission changed concurrently; refresh and try again' }
  }
  return { ok: true, submission: reloaded.submission }
}

export async function listPracticalSubmissionsForCourse(
  courseId: string
): Promise<{ rows: Array<PracticalSubmissionRecord & { assessment_title: string; student_name: string; student_email: string }>; error?: string }> {
  if (!supabaseAdmin) return { rows: [], error: 'Database not configured' }

  const { assessments, error } = await listPracticalAssessments(courseId)
  if (error) return { rows: [], error }
  const ids = assessments.map((a) => a.id)
  if (!ids.length) return { rows: [] }

  const titleById = new Map(assessments.map((a) => [a.id, a.title]))
  const { data, error: subError } = await supabaseAdmin
    .from('assessment_submissions')
    .select(
      'id, assessment_id, enrollment_id, user_id, score, passed, practical_status, student_notes, feedback_summary, practical_percent, graded_at, returned_at, submitted_at'
    )
    .in('assessment_id', ids)
    .not('practical_status', 'is', null)
    .order('submitted_at', { ascending: false })

  if (subError) return { rows: [], error: missingSchemaError(subError.message) }

  const enrollmentIds = [...new Set((data ?? []).map((row) => String(row.enrollment_id)))]
  const { data: enrollments } = enrollmentIds.length
    ? await supabaseAdmin
        .from('course_enrollments')
        .select('id, applicant_name, applicant_email')
        .in('id', enrollmentIds)
    : { data: [] as Array<Record<string, unknown>> }

  const enrollById = new Map(
    (enrollments ?? []).map((row) => [
      String(row.id),
      { name: String(row.applicant_name ?? ''), email: String(row.applicant_email ?? '') },
    ])
  )

  const rows = []
  for (const row of data ?? []) {
    const extras = await loadSubmissionExtras(String(row.id))
    const base = mapSubmission(row as Record<string, unknown>, extras)
    const enroll = enrollById.get(base.enrollment_id)
    rows.push({
      ...base,
      assessment_title: titleById.get(base.assessment_id) ?? 'Practical',
      student_name: enroll?.name ?? 'Student',
      student_email: enroll?.email ?? '',
    })
  }
  return { rows }
}

export async function markPracticalSubmission(input: {
  courseId: string
  submissionId: string
  graderUserId: string
  action: 'grade' | 'return'
  feedbackSummary?: string | null
  criterionScores: Array<{
    criterionId: string
    pointsAwarded: number
    levelId?: string | null
    comment?: string
  }>
}): Promise<{ ok: true; submission: PracticalSubmissionRecord } | { ok: false; error: string }> {
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured' }

  const { data: row, error } = await supabaseAdmin
    .from('assessment_submissions')
    .select(
      'id, assessment_id, enrollment_id, user_id, score, passed, practical_status, student_notes, feedback_summary, practical_percent, graded_at, returned_at, submitted_at'
    )
    .eq('id', input.submissionId)
    .maybeSingle()
  if (error || !row) return { ok: false, error: missingSchemaError(error?.message || 'Submission not found') }

  const assessment = await getPracticalAssessment(String(row.assessment_id), { courseId: input.courseId })
  if (!assessment.assessment?.rubric) {
    return { ok: false, error: assessment.error || 'Rubric not found for assessment' }
  }

  const status = (row.practical_status as PracticalStatus | null) ?? 'draft'
  const nextStatus: PracticalStatus = input.action === 'return' ? 'returned' : 'graded'
  const transition = assertPracticalTransition({ from: status, to: nextStatus, actor: 'lecturer' })
  if (!transition.ok) return { ok: false, error: transition.error }

  const scored = computePracticalScore({
    criterionScores: input.criterionScores.map((rowScore) => ({
      criterionId: rowScore.criterionId,
      pointsAwarded: rowScore.pointsAwarded,
      levelId: rowScore.levelId,
    })),
    criteria: assessment.assessment.rubric.criteria.map((c) => ({
      id: c.id,
      max_points: c.max_points,
      levels: c.levels.map((l) => ({ id: l.id })),
    })),
  })
  if (!scored.ok) return { ok: false, error: scored.error }

  // Never trust client-supplied aggregate percentage — only persist server-computed values.
  // Fail closed: criterion scores and status change only via transactional RPC (locks parent row first).
  const passed = passFromPercent(scored.percent, assessment.assessment.passing_score)
  const { error: rpcError } = await supabaseAdmin.rpc('mark_practical_submission', {
    p_submission_id: input.submissionId,
    p_expected_status: status,
    p_next_status: nextStatus,
    p_grader_user_id: input.graderUserId,
    p_feedback_summary: input.feedbackSummary?.trim() || null,
    p_percent: scored.percent,
    p_passed: passed,
    p_criterion_scores: input.criterionScores.map((rowScore) => ({
      criterion_id: rowScore.criterionId,
      level_id: rowScore.levelId || null,
      points_awarded: rowScore.pointsAwarded,
      comment: rowScore.comment ?? '',
    })),
  })
  if (rpcError) {
    return {
      ok: false,
      error: mapPracticalRpcFailure({
        operation: 'mark',
        submissionId: input.submissionId,
        rpcMessage: rpcError.message,
      }),
    }
  }

  const extras = await loadSubmissionExtras(input.submissionId)
  const { data: fresh } = await supabaseAdmin
    .from('assessment_submissions')
    .select(
      'id, assessment_id, enrollment_id, user_id, score, passed, practical_status, student_notes, feedback_summary, practical_percent, graded_at, returned_at, submitted_at'
    )
    .eq('id', input.submissionId)
    .single()

  if (!fresh || String(fresh.practical_status) !== nextStatus) {
    return { ok: false, error: 'Submission changed concurrently; refresh and try again' }
  }

  return {
    ok: true,
    submission: mapSubmission(fresh as Record<string, unknown>, extras),
  }
}

/**
 * Resolve a practical artifact to a short-lived signed URL after the caller
 * has already authorized the actor (student owner, course lecturer, or admin).
 */
export async function getPracticalArtifactSignedUrl(input: {
  artifactId: string
  /** When set, artifact must belong to this course. */
  courseId?: string
  /** When set (student path), artifact must belong to this user. */
  ownerUserId?: string
}): Promise<
  | { ok: true; url: string; fileName: string; contentType: string; courseId: string; assessmentId: string }
  | { ok: false; error: string; status: number }
> {
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured', status: 500 }

  const { data: artifact, error } = await supabaseAdmin
    .from('assessment_submission_artifacts')
    .select('id, submission_id, file_url, file_name, content_type, storage_key')
    .eq('id', input.artifactId)
    .maybeSingle()
  if (error) return { ok: false, error: missingSchemaError(error.message), status: 500 }
  if (!artifact) return { ok: false, error: 'Artifact not found', status: 404 }

  const { data: submission, error: subError } = await supabaseAdmin
    .from('assessment_submissions')
    .select('id, assessment_id, enrollment_id, user_id')
    .eq('id', artifact.submission_id)
    .maybeSingle()
  if (subError || !submission) {
    return { ok: false, error: missingSchemaError(subError?.message || 'Submission not found'), status: 404 }
  }

  const { assessment, error: assessError } = await getPracticalAssessment(String(submission.assessment_id), {
    courseId: input.courseId,
  })
  if (assessError) return { ok: false, error: assessError, status: 503 }
  if (!assessment) return { ok: false, error: 'Assessment not found', status: 404 }
  if (input.courseId && assessment.course_id !== input.courseId) {
    return { ok: false, error: 'Artifact does not belong to this course', status: 403 }
  }

  if (input.ownerUserId) {
    const ownerId = String(submission.user_id || '')
    if (ownerId && ownerId !== input.ownerUserId) {
      return { ok: false, error: 'Forbidden', status: 403 }
    }
    if (!ownerId) {
      const { data: enrollment } = await supabaseAdmin
        .from('course_enrollments')
        .select('id, user_id')
        .eq('id', submission.enrollment_id)
        .maybeSingle()
      if (!enrollment || String(enrollment.user_id) !== input.ownerUserId) {
        return { ok: false, error: 'Forbidden', status: 403 }
      }
    }
  }

  let storageKey = artifact.storage_key ? String(artifact.storage_key) : null
  if (!storageKey) {
    const { parseObjectPath } = await import('@/lib/storage/object-storage')
    const fromUrl = parseObjectPath(String(artifact.file_url ?? ''))
    if (fromUrl?.startsWith('assessment-submissions/')) storageKey = fromUrl
  }
  if (!storageKey) {
    return { ok: false, error: 'Artifact has no private storage reference', status: 404 }
  }

  try {
    const url = await createSignedGetUrl(storageKey, 300)
    return {
      ok: true,
      url,
      fileName: String(artifact.file_name),
      contentType: String(artifact.content_type || 'application/octet-stream'),
      courseId: assessment.course_id,
      assessmentId: assessment.id,
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not create download URL',
      status: 500,
    }
  }
}

/** Filter helper for quiz queries once migration 104 is applied. */
export function isQuizAssessmentKind(value: unknown): boolean {
  if (value == null || value === '') return true
  return String(value) === 'quiz'
}

export type { AssessmentKind, PracticalBrief, RubricInput }
