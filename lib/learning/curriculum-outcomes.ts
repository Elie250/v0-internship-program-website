import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const OUTCOME_SCOPES = ['programme', 'course', 'module', 'lesson'] as const
export type OutcomeScope = (typeof OUTCOME_SCOPES)[number]

export const OUTCOME_SCOPE_HELP: Record<OutcomeScope, string> = {
  programme:
    'Programme-level outcomes (PLOs): top-level aims of this offering. Separate from brochure report text.',
  course: 'Course-level outcomes (CLOs): measurable results for this taught course.',
  module: 'Module-level outcomes for a single module in this course.',
  lesson: 'Lesson-level objectives for a single lesson.',
}

const MIGRATION_HINT =
  'Curriculum outcomes need scripts/103-curriculum-outcomes-and-module-authoring.sql applied in Supabase.'

function storageMessage(message: string): string | null {
  if (
    /relation .* does not exist|could not find the table|could not find the .* column|schema cache/i.test(
      message
    )
  ) {
    return MIGRATION_HINT
  }
  return null
}

export type CurriculumOutcome = {
  id: string
  courseId: string
  scope: OutcomeScope
  moduleId: string | null
  contentId: string | null
  code: string | null
  statement: string
  successCriteria: string | null
  sortOrder: number
}

function mapOutcome(row: Record<string, unknown>): CurriculumOutcome {
  return {
    id: String(row.id),
    courseId: String(row.course_id),
    scope: row.scope as OutcomeScope,
    moduleId: row.module_id != null ? String(row.module_id) : null,
    contentId: row.content_id != null ? String(row.content_id) : null,
    code: row.code != null ? String(row.code) : null,
    statement: String(row.statement ?? ''),
    successCriteria: row.success_criteria != null ? String(row.success_criteria) : null,
    sortOrder: Number(row.sort_order ?? 0),
  }
}

async function authorize(courseId: string, mode: 'admin' | 'lecturer') {
  if (mode === 'admin') await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
  else await requireLecturerCourseAccess(courseId)
  if (!supabaseAdmin) throw new Error('Learning outcomes are temporarily unavailable.')
  return supabaseAdmin
}

function isOutcomeScope(value: unknown): value is OutcomeScope {
  return typeof value === 'string' && (OUTCOME_SCOPES as readonly string[]).includes(value)
}

export function validateOutcomeShape(input: {
  scope: OutcomeScope
  moduleId?: string | null
  contentId?: string | null
  statement: string
  sortOrder?: number
}): { ok: true } | { ok: false; error: string } {
  if (!input.statement.trim()) return { ok: false, error: 'Outcome statement is required.' }
  if (input.sortOrder != null && (!Number.isInteger(input.sortOrder) || input.sortOrder < 0)) {
    return { ok: false, error: 'sort_order must be a non-negative integer.' }
  }
  if (input.scope === 'programme' || input.scope === 'course') {
    if (input.moduleId || input.contentId) {
      return { ok: false, error: 'Programme/course outcomes cannot reference a module or lesson.' }
    }
  }
  if (input.scope === 'module') {
    if (!input.moduleId) return { ok: false, error: 'Module outcomes require module_id.' }
    if (input.contentId) return { ok: false, error: 'Module outcomes cannot reference a lesson.' }
  }
  if (input.scope === 'lesson') {
    if (!input.contentId) return { ok: false, error: 'Lesson outcomes require content_id.' }
    if (input.moduleId) return { ok: false, error: 'Lesson outcomes must not set module_id.' }
  }
  return { ok: true }
}

export async function listCurriculumOutcomes(
  courseId: string,
  filters: { scope?: OutcomeScope; moduleId?: string; contentId?: string } = {},
  mode: 'admin' | 'lecturer' = 'admin'
): Promise<{ ok: true; outcomes: CurriculumOutcome[] } | { ok: false; error: string }> {
  try {
    const db = await authorize(courseId, mode)
    let query = db
      .from('curriculum_learning_outcomes')
      .select(
        'id, course_id, scope, module_id, content_id, code, statement, success_criteria, sort_order'
      )
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })

    if (filters.scope) query = query.eq('scope', filters.scope)
    if (filters.moduleId) query = query.eq('module_id', filters.moduleId)
    if (filters.contentId) query = query.eq('content_id', filters.contentId)

    const { data, error } = await query
    if (error) return { ok: false, error: storageMessage(error.message) ?? error.message }
    return { ok: true, outcomes: (data ?? []).map((row) => mapOutcome(row as Record<string, unknown>)) }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return { ok: false, error: message }
  }
}

/** Student/brochure-adjacent read after enrollment auth (no admin gate). */
export async function listPublishedCourseOutcomesForStudent(
  courseId: string
): Promise<CurriculumOutcome[]> {
  if (!supabaseAdmin) return []
  const { data, error } = await supabaseAdmin
    .from('curriculum_learning_outcomes')
    .select(
      'id, course_id, scope, module_id, content_id, code, statement, success_criteria, sort_order'
    )
    .eq('course_id', courseId)
    .in('scope', ['programme', 'course'])
    .order('scope', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
  if (error || !data) return []
  return data.map((row) => mapOutcome(row as Record<string, unknown>))
}

export async function createCurriculumOutcome(
  courseId: string,
  input: {
    scope: string
    statement: string
    code?: string | null
    successCriteria?: string | null
    moduleId?: string | null
    contentId?: string | null
    sortOrder?: number
  },
  mode: 'admin' | 'lecturer' = 'admin'
): Promise<{ ok: true; outcome: CurriculumOutcome } | { ok: false; error: string }> {
  try {
    const db = await authorize(courseId, mode)
    if (!isOutcomeScope(input.scope)) {
      return { ok: false, error: `scope must be one of: ${OUTCOME_SCOPES.join(', ')}` }
    }
    const shape = validateOutcomeShape({
      scope: input.scope,
      moduleId: input.moduleId,
      contentId: input.contentId,
      statement: input.statement,
      sortOrder: input.sortOrder,
    })
    if (!shape.ok) return shape

    if (input.moduleId) {
      const { data: mod } = await db
        .from('course_modules')
        .select('id')
        .eq('id', input.moduleId)
        .eq('course_id', courseId)
        .maybeSingle()
      if (!mod) return { ok: false, error: 'Module not found on this course.' }
    }
    if (input.contentId) {
      const { data: lesson } = await db
        .from('course_content')
        .select('id')
        .eq('id', input.contentId)
        .eq('course_id', courseId)
        .maybeSingle()
      if (!lesson) return { ok: false, error: 'Lesson not found on this course.' }
    }

    let sortOrder = input.sortOrder
    if (sortOrder == null) {
      let q = db
        .from('curriculum_learning_outcomes')
        .select('sort_order')
        .eq('course_id', courseId)
        .eq('scope', input.scope)
        .order('sort_order', { ascending: false })
        .limit(1)
      if (input.moduleId) q = q.eq('module_id', input.moduleId)
      if (input.contentId) q = q.eq('content_id', input.contentId)
      const { data: existing } = await q
      sortOrder = Number(existing?.[0]?.sort_order ?? -1) + 1
    }

    const { data, error } = await db
      .from('curriculum_learning_outcomes')
      .insert({
        course_id: courseId,
        scope: input.scope,
        module_id: input.moduleId ?? null,
        content_id: input.contentId ?? null,
        code: input.code != null ? String(input.code).trim() || null : null,
        statement: String(input.statement).trim(),
        success_criteria:
          input.successCriteria != null ? String(input.successCriteria).trim() || null : null,
        sort_order: sortOrder,
        updated_at: new Date().toISOString(),
      })
      .select(
        'id, course_id, scope, module_id, content_id, code, statement, success_criteria, sort_order'
      )
      .single()

    if (error || !data) {
      return { ok: false, error: storageMessage(error?.message ?? '') ?? error?.message ?? 'Create failed' }
    }
    return { ok: true, outcome: mapOutcome(data as Record<string, unknown>) }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return { ok: false, error: message }
  }
}

export async function updateCurriculumOutcome(
  courseId: string,
  outcomeId: string,
  input: {
    statement?: string
    code?: string | null
    successCriteria?: string | null
    sortOrder?: number
  },
  mode: 'admin' | 'lecturer' = 'admin'
): Promise<{ ok: true; outcome: CurriculumOutcome } | { ok: false; error: string }> {
  try {
    const db = await authorize(courseId, mode)
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (input.statement !== undefined) {
      if (!String(input.statement).trim()) return { ok: false, error: 'Outcome statement is required.' }
      patch.statement = String(input.statement).trim()
    }
    if (input.code !== undefined) patch.code = String(input.code ?? '').trim() || null
    if (input.successCriteria !== undefined) {
      patch.success_criteria = String(input.successCriteria ?? '').trim() || null
    }
    if (input.sortOrder !== undefined) {
      if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0) {
        return { ok: false, error: 'sort_order must be a non-negative integer.' }
      }
      patch.sort_order = input.sortOrder
    }

    const { data, error } = await db
      .from('curriculum_learning_outcomes')
      .update(patch)
      .eq('id', outcomeId)
      .eq('course_id', courseId)
      .select(
        'id, course_id, scope, module_id, content_id, code, statement, success_criteria, sort_order'
      )
      .maybeSingle()

    if (error) return { ok: false, error: storageMessage(error.message) ?? error.message }
    if (!data) return { ok: false, error: 'Outcome not found.' }
    return { ok: true, outcome: mapOutcome(data as Record<string, unknown>) }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return { ok: false, error: message }
  }
}

export async function deleteCurriculumOutcome(
  courseId: string,
  outcomeId: string,
  mode: 'admin' | 'lecturer' = 'admin'
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const db = await authorize(courseId, mode)
    const { data, error } = await db
      .from('curriculum_learning_outcomes')
      .delete()
      .eq('id', outcomeId)
      .eq('course_id', courseId)
      .select('id')
      .maybeSingle()
    if (error) return { ok: false, error: storageMessage(error.message) ?? error.message }
    if (!data) return { ok: false, error: 'Outcome not found.' }
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return { ok: false, error: message }
  }
}
