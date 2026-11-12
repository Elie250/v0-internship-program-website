import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import {
  isActivityKind,
  parseEstimatedMinutesInput,
  type ActivityKind,
} from '@/lib/learning/curriculum-workload'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { randomUUID } from 'node:crypto'

const MIGRATION_HINT =
  'Learning plans are not ready. Run scripts/101-curriculum-workload-and-learning-plans.sql then scripts/102-learning-plan-publish-integrity.sql in Supabase.'

function storageMessage(message: string): string | null {
  if (
    /relation .* does not exist|could not find the table|could not find the .* column|column .* does not exist|schema cache|function .* does not exist|Could not find the function/i.test(
      message
    )
  ) {
    return MIGRATION_HINT
  }
  return null
}

function conflictMessage(message: string): string | null {
  if (/duplicate key|unique constraint|course_learning_plan_templates_course_revision_uidx|course_learning_plan_templates_one_draft/i.test(message)) {
    return 'Another learning-plan change landed first. Reload and try again.'
  }
  return null
}

export type PlanActivityType = 'lesson' | 'assessment'

export type CurriculumActivityRef = {
  id: string
  title: string
  activityType: PlanActivityType
  estimatedMinutes: number | null
  activityKind: ActivityKind | null
  visibility?: string | null
  isPublished?: boolean
}

export type LearningPlanItemInput = {
  activityType: PlanActivityType
  activityId: string
  sortOrder?: number
  isOptional?: boolean
  portionMinutes?: number | null
  spanGroupId?: string | null
}

export type LearningPlanDayInput = {
  dayIndex: number
  title?: string | null
  items: LearningPlanItemInput[]
}

export type LearningPlanItemView = {
  id: string
  activityType: PlanActivityType
  activityId: string
  sortOrder: number
  isOptional: boolean
  portionMinutes: number | null
  spanGroupId: string | null
  snapshotMinutes: number | null
  snapshotActivityKind: ActivityKind | null
  snapshotTitle: string | null
  activityTitle: string | null
  liveEstimatedMinutes: number | null
  liveActivityKind: ActivityKind | null
  sourceStillExists: boolean
  plannedMinutes: number | null
}

export type LearningPlanDayView = {
  id: string
  dayIndex: number
  title: string | null
  sortOrder: number
  items: LearningPlanItemView[]
  workloadMinutes: number
}

export type LearningPlanWarning = {
  code: string
  message: string
}

export type LearningPlanTemplateView = {
  id: string
  courseId: string
  title: string
  status: 'draft' | 'published' | 'archived'
  revision: number
  notes: string | null
  updatedAt: string | null
  publishedAt: string | null
  days: LearningPlanDayView[]
  totalWorkloadMinutes: number
  warnings: LearningPlanWarning[]
}

async function authorize() {
  const session = await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
  if (!supabaseAdmin) throw new Error('Learning plans are temporarily unavailable.')
  return { session, db: supabaseAdmin }
}

function denied(error: unknown): { ok: false; error: string } {
  const message = error instanceof Error ? error.message : 'Forbidden'
  return { ok: false, error: message || 'Learning plans are temporarily unavailable.' }
}

function isHistoricalStatus(status: string): boolean {
  return status === 'published' || status === 'archived'
}

export async function listCurriculumActivitiesForPlan(courseId: string): Promise<
  { ok: true; activities: CurriculumActivityRef[]; warning: string | null } | { ok: false; error: string }
> {
  try {
    const { db } = await authorize()
    const [{ data: lessons, error: lessonError }, { data: assessments, error: assessmentError }] =
      await Promise.all([
        db
          .from('course_content')
          .select('id, title, estimated_minutes, activity_kind, visibility, sort_order')
          .eq('course_id', courseId)
          .order('sort_order', { ascending: true }),
        db
          .from('course_assessments')
          .select('id, title, estimated_minutes, activity_kind, is_published, sort_order')
          .eq('course_id', courseId)
          .order('sort_order', { ascending: true }),
      ])

    if (lessonError) {
      const hint = storageMessage(lessonError.message)
      if (hint) return { ok: true, activities: [], warning: hint }
      return { ok: false, error: lessonError.message }
    }
    if (assessmentError) {
      const hint = storageMessage(assessmentError.message)
      if (hint) return { ok: true, activities: [], warning: hint }
      return { ok: false, error: assessmentError.message }
    }

    const activities: CurriculumActivityRef[] = [
      ...(lessons ?? []).map((row) => ({
        id: String(row.id),
        title: String(row.title ?? 'Lesson'),
        activityType: 'lesson' as const,
        estimatedMinutes: row.estimated_minutes == null ? null : Number(row.estimated_minutes),
        activityKind: isActivityKind(row.activity_kind) ? row.activity_kind : null,
        visibility: row.visibility != null ? String(row.visibility) : null,
      })),
      ...(assessments ?? []).map((row) => ({
        id: String(row.id),
        title: String(row.title ?? 'Assessment'),
        activityType: 'assessment' as const,
        estimatedMinutes: row.estimated_minutes == null ? null : Number(row.estimated_minutes),
        activityKind: isActivityKind(row.activity_kind) ? row.activity_kind : null,
        isPublished: row.is_published !== false,
      })),
    ]

    return { ok: true, activities, warning: null }
  } catch (error) {
    return denied(error)
  }
}

async function loadActivityMap(courseId: string): Promise<Map<string, CurriculumActivityRef>> {
  const listed = await listCurriculumActivitiesForPlan(courseId)
  if (!listed.ok) throw new Error(listed.error)
  const map = new Map<string, CurriculumActivityRef>()
  for (const activity of listed.activities) {
    map.set(`${activity.activityType}:${activity.id}`, activity)
  }
  return map
}

function itemPlannedMinutes(item: {
  portionMinutes: number | null
  snapshotMinutes: number | null
  liveEstimatedMinutes: number | null
  status: string
}): number | null {
  if (isHistoricalStatus(item.status)) {
    return item.snapshotMinutes
  }
  if (item.portionMinutes != null) return item.portionMinutes
  return item.liveEstimatedMinutes
}

function buildWarnings(
  templateStatus: string,
  days: LearningPlanDayView[],
  activities: CurriculumActivityRef[]
): LearningPlanWarning[] {
  const warnings: LearningPlanWarning[] = []
  const mapped = new Set<string>()
  const historical = isHistoricalStatus(templateStatus)

  for (const day of days) {
    for (const item of day.items) {
      const key = `${item.activityType}:${item.activityId}`
      mapped.add(key)
      if (!historical && !item.sourceStillExists) {
        warnings.push({
          code: 'stale_activity',
          message: `Day ${day.dayIndex}: activity ${item.activityId} is missing from the curriculum.`,
        })
      }
      if (historical && !item.sourceStillExists) {
        warnings.push({
          code: 'source_removed',
          message: `Day ${day.dayIndex}: "${item.activityTitle ?? item.activityId}" is retained from the published snapshot; the live curriculum activity was removed.`,
        })
      }
      if (!historical && item.plannedMinutes == null && !item.isOptional) {
        warnings.push({
          code: 'missing_minutes',
          message: `Day ${day.dayIndex}: "${item.activityTitle ?? item.activityId}" has no planned minutes.`,
        })
      }
      if (!historical && item.liveActivityKind == null) {
        warnings.push({
          code: 'missing_kind',
          message: `Day ${day.dayIndex}: "${item.activityTitle ?? item.activityId}" needs an activity kind before publishing.`,
        })
      }
    }
  }

  if (!historical) {
    for (const activity of activities) {
      const key = `${activity.activityType}:${activity.id}`
      if (!mapped.has(key) && activity.estimatedMinutes != null) {
        warnings.push({
          code: 'unmapped_activity',
          message: `"${activity.title}" has estimated minutes but is not on the learning plan.`,
        })
      }
      if (activity.estimatedMinutes == null) {
        warnings.push({
          code: 'curriculum_missing_minutes',
          message: `"${activity.title}" has no estimated minutes.`,
        })
      }
    }
  }

  const spanTotals = new Map<
    string,
    { sum: number; expected: number | null; title: string; incomplete: boolean }
  >()
  for (const day of days) {
    for (const item of day.items) {
      if (!item.spanGroupId) continue
      const portion = historical ? item.snapshotMinutes : item.portionMinutes
      const expected = historical
        ? null
        : item.liveEstimatedMinutes
      if (portion == null) {
        warnings.push({
          code: 'incomplete_split',
          message: `Day ${day.dayIndex}: multi-day activity "${item.activityTitle ?? item.activityId}" needs an explicit portion duration.`,
        })
        const entry = spanTotals.get(item.spanGroupId) ?? {
          sum: 0,
          expected,
          title: item.activityTitle ?? item.activityId,
          incomplete: true,
        }
        entry.incomplete = true
        spanTotals.set(item.spanGroupId, entry)
        continue
      }
      const entry = spanTotals.get(item.spanGroupId) ?? {
        sum: 0,
        expected,
        title: item.activityTitle ?? item.activityId,
        incomplete: false,
      }
      entry.sum += portion
      if (!historical && entry.expected == null) entry.expected = expected
      spanTotals.set(item.spanGroupId, entry)
    }
  }

  for (const [, entry] of spanTotals) {
    if (entry.incomplete) continue
    if (historical) {
      // Historical portions were validated at publish; only flag internal inconsistency.
      continue
    }
    if (entry.expected == null) {
      warnings.push({
        code: 'split_missing_source_minutes',
        message: `Multi-day split for "${entry.title}" needs a source estimated duration.`,
      })
    } else if (entry.sum !== entry.expected) {
      warnings.push({
        code: 'split_mismatch',
        message: `Multi-day portions for "${entry.title}" sum to ${entry.sum} minutes but the activity estimate is ${entry.expected}.`,
      })
    }
  }

  // For historical multi-day splits, verify portion snapshots are present (already gated at publish).
  if (historical) {
    for (const day of days) {
      for (const item of day.items) {
        if (item.spanGroupId && item.snapshotMinutes == null) {
          warnings.push({
            code: 'incomplete_split',
            message: `Day ${day.dayIndex}: published multi-day activity "${item.activityTitle ?? item.activityId}" is missing snapshot minutes.`,
          })
        }
      }
    }
  }

  const indexes = days.map((d) => d.dayIndex).sort((a, b) => a - b)
  for (let i = 0; i < indexes.length; i++) {
    if (indexes[i] !== i + 1) {
      warnings.push({
        code: 'day_gap',
        message: 'Learning days should be contiguous starting at day 1.',
      })
      break
    }
  }

  if (templateStatus === 'draft' && days.length === 0) {
    warnings.push({ code: 'empty_plan', message: 'Add at least one learning day before publishing.' })
  }

  return warnings
}

async function hydrateTemplate(
  courseId: string,
  templateRow: Record<string, unknown>
): Promise<LearningPlanTemplateView> {
  const { db } = await authorize()
  const templateId = String(templateRow.id)
  const status = String(templateRow.status ?? 'draft') as LearningPlanTemplateView['status']
  const historical = isHistoricalStatus(status)

  const { data: dayRows, error: dayError } = await db
    .from('course_learning_plan_days')
    .select('id, day_index, title, sort_order')
    .eq('template_id', templateId)
    .order('day_index', { ascending: true })

  if (dayError) throw new Error(storageMessage(dayError.message) ?? dayError.message)

  const dayIds = (dayRows ?? []).map((d) => String(d.id))
  let itemRows: Record<string, unknown>[] = []
  if (dayIds.length) {
    const { data, error } = await db
      .from('course_learning_plan_items')
      .select(
        'id, day_id, activity_type, activity_id, sort_order, is_optional, portion_minutes, span_group_id, snapshot_minutes, snapshot_activity_kind, snapshot_title'
      )
      .in('day_id', dayIds)
      .order('sort_order', { ascending: true })
    if (error) throw new Error(storageMessage(error.message) ?? error.message)
    itemRows = (data ?? []) as Record<string, unknown>[]
  }

  const activityMap = await loadActivityMap(courseId)
  const itemsByDay = new Map<string, LearningPlanItemView[]>()

  for (const row of itemRows) {
    const dayId = String(row.day_id)
    const activityType = String(row.activity_type) as PlanActivityType
    const activityId = String(row.activity_id)
    const live = activityMap.get(`${activityType}:${activityId}`)
    const portionMinutes = row.portion_minutes == null ? null : Number(row.portion_minutes)
    const snapshotMinutes = row.snapshot_minutes == null ? null : Number(row.snapshot_minutes)
    const snapshotActivityKind = isActivityKind(row.snapshot_activity_kind)
      ? row.snapshot_activity_kind
      : null
    const snapshotTitle =
      row.snapshot_title != null && String(row.snapshot_title).trim()
        ? String(row.snapshot_title).trim()
        : null
    const liveEstimatedMinutes = live?.estimatedMinutes ?? null
    const activityTitle = historical ? snapshotTitle : live?.title ?? null
    const item: LearningPlanItemView = {
      id: String(row.id),
      activityType,
      activityId,
      sortOrder: Number(row.sort_order ?? 0),
      isOptional: row.is_optional === true,
      portionMinutes,
      spanGroupId: row.span_group_id != null ? String(row.span_group_id) : null,
      snapshotMinutes,
      snapshotActivityKind,
      snapshotTitle,
      activityTitle,
      liveEstimatedMinutes,
      liveActivityKind: live?.activityKind ?? null,
      sourceStillExists: Boolean(live),
      plannedMinutes: itemPlannedMinutes({
        portionMinutes,
        snapshotMinutes,
        liveEstimatedMinutes,
        status,
      }),
    }
    itemsByDay.set(dayId, [...(itemsByDay.get(dayId) ?? []), item])
  }

  const days: LearningPlanDayView[] = (dayRows ?? []).map((day) => {
    const items = itemsByDay.get(String(day.id)) ?? []
    const workloadMinutes = items.reduce((sum, item) => sum + (item.plannedMinutes ?? 0), 0)
    return {
      id: String(day.id),
      dayIndex: Number(day.day_index),
      title: day.title != null ? String(day.title) : null,
      sortOrder: Number(day.sort_order ?? 0),
      items,
      workloadMinutes,
    }
  })

  const activities = [...activityMap.values()]
  const warnings = buildWarnings(status, days, activities)
  const totalWorkloadMinutes = days.reduce((sum, day) => sum + day.workloadMinutes, 0)

  return {
    id: templateId,
    courseId,
    title: String(templateRow.title ?? 'Learning plan'),
    status,
    revision: Number(templateRow.revision ?? 0),
    notes: templateRow.notes != null ? String(templateRow.notes) : null,
    updatedAt: templateRow.updated_at != null ? String(templateRow.updated_at) : null,
    publishedAt: templateRow.published_at != null ? String(templateRow.published_at) : null,
    days,
    totalWorkloadMinutes,
    warnings,
  }
}

export async function listLearningPlanTemplates(courseId: string): Promise<
  | { ok: true; templates: LearningPlanTemplateView[]; warning: string | null }
  | { ok: false; error: string }
> {
  try {
    const { db } = await authorize()
    const { data, error } = await db
      .from('course_learning_plan_templates')
      .select('id, course_id, title, status, revision, notes, updated_at, published_at')
      .eq('course_id', courseId)
      .order('status', { ascending: true })
      .order('revision', { ascending: false })

    if (error) {
      const hint = storageMessage(error.message)
      if (hint) return { ok: true, templates: [], warning: hint }
      return { ok: false, error: error.message }
    }

    const templates: LearningPlanTemplateView[] = []
    for (const row of data ?? []) {
      templates.push(await hydrateTemplate(courseId, row as Record<string, unknown>))
    }
    return { ok: true, templates, warning: null }
  } catch (error) {
    return denied(error)
  }
}

export async function ensureDraftLearningPlan(
  courseId: string,
  title = 'Daily learning plan'
): Promise<{ ok: true; template: LearningPlanTemplateView } | { ok: false; error: string }> {
  try {
    const { session, db } = await authorize()
    const { data: existing } = await db
      .from('course_learning_plan_templates')
      .select('id, course_id, title, status, revision, notes, updated_at, published_at')
      .eq('course_id', courseId)
      .eq('status', 'draft')
      .maybeSingle()

    if (existing) {
      return { ok: true, template: await hydrateTemplate(courseId, existing as Record<string, unknown>) }
    }

    const now = new Date().toISOString()
    const { data, error } = await db
      .from('course_learning_plan_templates')
      .insert({
        course_id: courseId,
        title,
        status: 'draft',
        revision: 0,
        updated_at: now,
        updated_by: session.user.id,
      })
      .select('id, course_id, title, status, revision, notes, updated_at, published_at')
      .single()

    if (error) {
      const conflict = conflictMessage(error.message)
      if (conflict) {
        const { data: raced } = await db
          .from('course_learning_plan_templates')
          .select('id, course_id, title, status, revision, notes, updated_at, published_at')
          .eq('course_id', courseId)
          .eq('status', 'draft')
          .maybeSingle()
        if (raced) {
          return { ok: true, template: await hydrateTemplate(courseId, raced as Record<string, unknown>) }
        }
        return { ok: false, error: conflict }
      }
      return { ok: false, error: storageMessage(error.message) ?? error.message }
    }
    return { ok: true, template: await hydrateTemplate(courseId, data as Record<string, unknown>) }
  } catch (error) {
    return denied(error)
  }
}

function validateDaysInput(days: LearningPlanDayInput[]): { ok: true } | { ok: false; error: string } {
  if (!Array.isArray(days)) return { ok: false, error: 'Days payload is required.' }
  const seen = new Set<number>()
  for (const day of days) {
    if (!Number.isInteger(day.dayIndex) || day.dayIndex < 1) {
      return { ok: false, error: 'Each day_index must be a positive integer starting at 1.' }
    }
    if (seen.has(day.dayIndex)) {
      return { ok: false, error: `Duplicate day_index ${day.dayIndex}.` }
    }
    seen.add(day.dayIndex)
    if (!Array.isArray(day.items)) return { ok: false, error: 'Each day must include an items array.' }
    for (const item of day.items) {
      if (item.activityType !== 'lesson' && item.activityType !== 'assessment') {
        return { ok: false, error: 'activityType must be lesson or assessment.' }
      }
      if (!String(item.activityId ?? '').trim()) {
        return { ok: false, error: 'Each item needs an activityId.' }
      }
      if (item.portionMinutes != null) {
        const portion = parseEstimatedMinutesInput(item.portionMinutes)
        if (!portion.ok || portion.minutes == null) {
          return { ok: false, error: portion.ok ? 'portionMinutes must be positive.' : portion.error }
        }
      }
    }
  }
  return { ok: true }
}

export async function saveDraftLearningPlan(
  courseId: string,
  input: {
    templateId: string
    title?: string
    notes?: string | null
    days: LearningPlanDayInput[]
  }
): Promise<{ ok: true; template: LearningPlanTemplateView } | { ok: false; error: string }> {
  try {
    const { session, db } = await authorize()
    const daysCheck = validateDaysInput(input.days)
    if (!daysCheck.ok) return daysCheck

    const { data: template, error: templateError } = await db
      .from('course_learning_plan_templates')
      .select('id, course_id, title, status, revision, notes, updated_at, published_at')
      .eq('id', input.templateId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (templateError) return { ok: false, error: storageMessage(templateError.message) ?? templateError.message }
    if (!template) return { ok: false, error: 'Learning plan draft not found.' }
    if (String(template.status) !== 'draft') {
      return {
        ok: false,
        error:
          'Published revisions cannot be edited in place. Clone the revision into a draft first.',
      }
    }

    const activityMap = await loadActivityMap(courseId)
    for (const day of input.days) {
      for (const item of day.items) {
        const key = `${item.activityType}:${item.activityId}`
        if (!activityMap.has(key)) {
          return {
            ok: false,
            error: `Activity ${item.activityId} does not belong to this course.`,
          }
        }
      }
    }

    // Replace days/items for the draft atomically enough for admin use: delete then insert.
    const { data: existingDays } = await db
      .from('course_learning_plan_days')
      .select('id')
      .eq('template_id', input.templateId)
    const existingDayIds = (existingDays ?? []).map((d) => String(d.id))
    if (existingDayIds.length) {
      await db.from('course_learning_plan_items').delete().in('day_id', existingDayIds)
      await db.from('course_learning_plan_days').delete().eq('template_id', input.templateId)
    }

    const now = new Date().toISOString()
    const title = input.title != null ? String(input.title).trim() || 'Daily learning plan' : undefined
    const metaPatch: Record<string, unknown> = {
      updated_at: now,
      updated_by: session.user.id,
    }
    if (title) metaPatch.title = title
    if (input.notes !== undefined) metaPatch.notes = String(input.notes ?? '').trim() || null
    const { error: metaError } = await db
      .from('course_learning_plan_templates')
      .update(metaPatch)
      .eq('id', input.templateId)

    if (metaError) {
      return {
        ok: false,
        error:
          conflictMessage(metaError.message) ??
          storageMessage(metaError.message) ??
          metaError.message,
      }
    }

    for (const day of input.days) {
      const { data: dayRow, error: dayError } = await db
        .from('course_learning_plan_days')
        .insert({
          template_id: input.templateId,
          day_index: day.dayIndex,
          title: day.title != null ? String(day.title).trim() || null : null,
          sort_order: day.dayIndex,
        })
        .select('id')
        .single()
      if (dayError || !dayRow) {
        return {
          ok: false,
          error:
            conflictMessage(dayError?.message ?? '') ??
            storageMessage(dayError?.message ?? '') ??
            dayError?.message ??
            'Failed to save day',
        }
      }

      if (!day.items.length) continue
      const rows = day.items.map((item, index) => ({
        day_id: dayRow.id,
        activity_type: item.activityType,
        activity_id: item.activityId,
        sort_order: item.sortOrder ?? index,
        is_optional: item.isOptional === true,
        portion_minutes: item.portionMinutes ?? null,
        span_group_id: item.spanGroupId ?? null,
        snapshot_minutes: null,
        snapshot_activity_kind: null,
        snapshot_title: null,
      }))
      const { error: itemError } = await db.from('course_learning_plan_items').insert(rows)
      if (itemError) {
        return {
          ok: false,
          error:
            conflictMessage(itemError.message) ??
            storageMessage(itemError.message) ??
            itemError.message,
        }
      }
    }

    const refreshed = await db
      .from('course_learning_plan_templates')
      .select('id, course_id, title, status, revision, notes, updated_at, published_at')
      .eq('id', input.templateId)
      .single()
    if (refreshed.error || !refreshed.data) {
      return { ok: false, error: refreshed.error?.message ?? 'Failed to reload draft' }
    }
    return {
      ok: true,
      template: await hydrateTemplate(courseId, refreshed.data as Record<string, unknown>),
    }
  } catch (error) {
    return denied(error)
  }
}

export async function publishLearningPlan(
  courseId: string,
  templateId: string
): Promise<{ ok: true; template: LearningPlanTemplateView } | { ok: false; error: string }> {
  try {
    const { session, db } = await authorize()
    const { data: draftRow, error: draftError } = await db
      .from('course_learning_plan_templates')
      .select('id, course_id, title, status, revision, notes, updated_at, published_at')
      .eq('id', templateId)
      .eq('course_id', courseId)
      .maybeSingle()
    if (draftError) return { ok: false, error: storageMessage(draftError.message) ?? draftError.message }
    if (!draftRow) return { ok: false, error: 'Learning plan not found.' }
    if (String(draftRow.status) !== 'draft') {
      return { ok: false, error: 'Only a draft learning plan can be published.' }
    }

    const view = await hydrateTemplate(courseId, draftRow as Record<string, unknown>)
    if (!view.days.length || view.days.every((d) => d.items.length === 0)) {
      return { ok: false, error: 'Add at least one activity before publishing.' }
    }

    const hardErrors = view.warnings.filter((w) =>
      [
        'stale_activity',
        'incomplete_split',
        'split_mismatch',
        'split_missing_source_minutes',
        'missing_kind',
      ].includes(w.code)
    )
    if (hardErrors.length) {
      return { ok: false, error: hardErrors[0].message }
    }

    for (const day of view.days) {
      for (const item of day.items) {
        if (item.spanGroupId && item.portionMinutes == null) {
          return {
            ok: false,
            error: `Multi-day activity on day ${day.dayIndex} needs an explicit portion duration.`,
          }
        }
        const minutes = item.portionMinutes ?? item.liveEstimatedMinutes
        if (minutes == null) {
          return {
            ok: false,
            error: `Set estimated minutes for "${item.activityTitle ?? item.activityId}" before publishing.`,
          }
        }
        if (!item.liveActivityKind) {
          return {
            ok: false,
            error: `Set an activity kind for "${item.activityTitle ?? item.activityId}" before publishing.`,
          }
        }
        if (!item.activityTitle?.trim()) {
          return {
            ok: false,
            error: `Activity ${item.activityId} is missing a display title.`,
          }
        }
      }
    }

    const payload = {
      title: view.title,
      notes: view.notes,
      days: view.days.map((day) => ({
        day_index: day.dayIndex,
        title: day.title,
        sort_order: day.sortOrder,
        items: day.items.map((item) => {
          const minutes = item.portionMinutes ?? item.liveEstimatedMinutes
          return {
            activity_type: item.activityType,
            activity_id: item.activityId,
            sort_order: item.sortOrder,
            is_optional: item.isOptional,
            portion_minutes: item.portionMinutes,
            span_group_id: item.spanGroupId,
            snapshot_minutes: minutes,
            snapshot_activity_kind: item.liveActivityKind,
            snapshot_title: item.activityTitle,
          }
        }),
      })),
    }

    const { data: publishedId, error: publishError } = await db.rpc('publish_course_learning_plan', {
      p_course_id: courseId,
      p_draft_id: templateId,
      p_updated_by: session.user.id,
      p_payload: payload,
    })

    if (publishError || !publishedId) {
      return {
        ok: false,
        error:
          conflictMessage(publishError?.message ?? '') ??
          storageMessage(publishError?.message ?? '') ??
          publishError?.message ??
          'Publish failed',
      }
    }

    const { data: published, error: loadError } = await db
      .from('course_learning_plan_templates')
      .select('id, course_id, title, status, revision, notes, updated_at, published_at')
      .eq('id', publishedId)
      .single()

    if (loadError || !published) {
      return { ok: false, error: loadError?.message ?? 'Published revision could not be reloaded.' }
    }

    return {
      ok: true,
      template: await hydrateTemplate(courseId, published as Record<string, unknown>),
    }
  } catch (error) {
    return denied(error)
  }
}

/**
 * Replace the course draft with a clone of a published/archived revision.
 * Preserves day/item structure and source activity IDs; clears snapshots for draft editing.
 */
export async function clonePublishedLearningPlanToDraft(
  courseId: string,
  sourceTemplateId: string
): Promise<{ ok: true; template: LearningPlanTemplateView } | { ok: false; error: string }> {
  try {
    const { session, db } = await authorize()

    const { data: source, error: sourceError } = await db
      .from('course_learning_plan_templates')
      .select('id, status')
      .eq('id', sourceTemplateId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (sourceError) return { ok: false, error: storageMessage(sourceError.message) ?? sourceError.message }
    if (!source) return { ok: false, error: 'Published learning plan not found.' }
    if (!isHistoricalStatus(String(source.status))) {
      return { ok: false, error: 'Only a published or archived revision can be cloned into a draft.' }
    }

    const { data: draftId, error: cloneError } = await db.rpc('clone_published_learning_plan_to_draft', {
      p_course_id: courseId,
      p_source_id: sourceTemplateId,
      p_updated_by: session.user.id,
    })

    if (cloneError || !draftId) {
      return {
        ok: false,
        error:
          conflictMessage(cloneError?.message ?? '') ??
          storageMessage(cloneError?.message ?? '') ??
          cloneError?.message ??
          'Could not clone revision into a draft',
      }
    }

    const { data: draft, error: loadError } = await db
      .from('course_learning_plan_templates')
      .select('id, course_id, title, status, revision, notes, updated_at, published_at')
      .eq('id', draftId)
      .single()

    if (loadError || !draft) {
      return { ok: false, error: loadError?.message ?? 'Cloned draft could not be reloaded.' }
    }

    return {
      ok: true,
      template: await hydrateTemplate(courseId, draft as Record<string, unknown>),
    }
  } catch (error) {
    return denied(error)
  }
}

export function newSpanGroupId(): string {
  return randomUUID()
}
