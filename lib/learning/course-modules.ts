import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const MIGRATION_HINT =
  'Course modules need scripts/95-lesson-blocks-and-modules.sql (and Phase A 103 for outcomes integrity) applied in Supabase.'

function storageMessage(message: string): string | null {
  if (/relation .* does not exist|could not find the table|schema cache/i.test(message)) {
    return MIGRATION_HINT
  }
  return null
}

export type CourseModuleRow = {
  id: string
  courseId: string
  title: string
  summary: string | null
  sortOrder: number
  lessonCount?: number
}

function mapModule(row: Record<string, unknown>, lessonCount?: number): CourseModuleRow {
  return {
    id: String(row.id),
    courseId: String(row.course_id),
    title: String(row.title ?? ''),
    summary: row.summary != null ? String(row.summary) : null,
    sortOrder: Number(row.sort_order ?? 0),
    lessonCount,
  }
}

async function authorizeCourse(courseId: string, mode: 'admin' | 'lecturer') {
  if (mode === 'admin') {
    await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
  } else {
    await requireLecturerCourseAccess(courseId)
  }
  if (!supabaseAdmin) throw new Error('Modules are temporarily unavailable.')
  return supabaseAdmin
}

export async function listCourseModules(
  courseId: string,
  mode: 'admin' | 'lecturer' = 'admin'
): Promise<{ ok: true; modules: CourseModuleRow[] } | { ok: false; error: string }> {
  try {
    const db = await authorizeCourse(courseId, mode)
    const { data, error } = await db
      .from('course_modules')
      .select('id, course_id, title, summary, sort_order')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })

    if (error) return { ok: false, error: storageMessage(error.message) ?? error.message }

    const moduleIds = (data ?? []).map((row) => String(row.id))
    const counts = new Map<string, number>()
    if (moduleIds.length) {
      const { data: lessons } = await db
        .from('course_content')
        .select('module_id')
        .eq('course_id', courseId)
        .in('module_id', moduleIds)
      for (const row of lessons ?? []) {
        const mid = row.module_id != null ? String(row.module_id) : ''
        if (!mid) continue
        counts.set(mid, (counts.get(mid) ?? 0) + 1)
      }
    }

    return {
      ok: true,
      modules: (data ?? []).map((row) => mapModule(row as Record<string, unknown>, counts.get(String(row.id)) ?? 0)),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return { ok: false, error: message }
  }
}

/** Public/student-safe module list (service role after caller auth). */
export async function listCourseModulesForStudent(courseId: string): Promise<CourseModuleRow[]> {
  if (!supabaseAdmin) return []
  const { data, error } = await supabaseAdmin
    .from('course_modules')
    .select('id, course_id, title, summary, sort_order')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
  if (error || !data) return []
  return data.map((row) => mapModule(row as Record<string, unknown>))
}

export async function createCourseModule(
  courseId: string,
  input: { title: string; summary?: string | null },
  mode: 'admin' | 'lecturer' = 'admin'
): Promise<{ ok: true; module: CourseModuleRow } | { ok: false; error: string }> {
  try {
    const db = await authorizeCourse(courseId, mode)
    const title = String(input.title ?? '').trim()
    if (!title) return { ok: false, error: 'Module title is required.' }

    const { data: existing } = await db
      .from('course_modules')
      .select('sort_order')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: false })
      .limit(1)
    const sortOrder = Number(existing?.[0]?.sort_order ?? -1) + 1

    const now = new Date().toISOString()
    const { data, error } = await db
      .from('course_modules')
      .insert({
        course_id: courseId,
        title,
        summary: input.summary != null ? String(input.summary).trim() || null : null,
        sort_order: sortOrder,
        updated_at: now,
      })
      .select('id, course_id, title, summary, sort_order')
      .single()

    if (error || !data) {
      return { ok: false, error: storageMessage(error?.message ?? '') ?? error?.message ?? 'Create failed' }
    }
    return { ok: true, module: mapModule(data as Record<string, unknown>, 0) }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return { ok: false, error: message }
  }
}

export async function updateCourseModule(
  courseId: string,
  moduleId: string,
  input: { title?: string; summary?: string | null; sortOrder?: number },
  mode: 'admin' | 'lecturer' = 'admin'
): Promise<{ ok: true; module: CourseModuleRow } | { ok: false; error: string }> {
  try {
    const db = await authorizeCourse(courseId, mode)
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (input.title !== undefined) {
      const title = String(input.title).trim()
      if (!title) return { ok: false, error: 'Module title is required.' }
      patch.title = title
    }
    if (input.summary !== undefined) {
      patch.summary = String(input.summary ?? '').trim() || null
    }
    if (input.sortOrder !== undefined) {
      if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0) {
        return { ok: false, error: 'sort_order must be a non-negative integer.' }
      }
      patch.sort_order = input.sortOrder
    }

    const { data, error } = await db
      .from('course_modules')
      .update(patch)
      .eq('id', moduleId)
      .eq('course_id', courseId)
      .select('id, course_id, title, summary, sort_order')
      .maybeSingle()

    if (error) return { ok: false, error: storageMessage(error.message) ?? error.message }
    if (!data) return { ok: false, error: 'Module not found.' }
    return { ok: true, module: mapModule(data as Record<string, unknown>) }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return { ok: false, error: message }
  }
}

export async function reorderCourseModules(
  courseId: string,
  orderedIds: string[],
  mode: 'admin' | 'lecturer' = 'admin'
): Promise<{ ok: true; modules: CourseModuleRow[] } | { ok: false; error: string }> {
  try {
    const listed = await listCourseModules(courseId, mode)
    if (!listed.ok) return listed
    const existingIds = new Set(listed.modules.map((m) => m.id))
    if (orderedIds.length !== existingIds.size || orderedIds.some((id) => !existingIds.has(id))) {
      return { ok: false, error: 'Reorder payload must include each module exactly once.' }
    }

    const db = await authorizeCourse(courseId, mode)
    const now = new Date().toISOString()
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await db
        .from('course_modules')
        .update({ sort_order: i, updated_at: now })
        .eq('id', orderedIds[i])
        .eq('course_id', courseId)
      if (error) return { ok: false, error: storageMessage(error.message) ?? error.message }
    }
    return listCourseModules(courseId, mode)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return { ok: false, error: message }
  }
}

export async function deleteCourseModule(
  courseId: string,
  moduleId: string,
  mode: 'admin' | 'lecturer' = 'admin'
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const db = await authorizeCourse(courseId, mode)
    const { data, error } = await db
      .from('course_modules')
      .delete()
      .eq('id', moduleId)
      .eq('course_id', courseId)
      .select('id')
      .maybeSingle()
    if (error) return { ok: false, error: storageMessage(error.message) ?? error.message }
    if (!data) return { ok: false, error: 'Module not found.' }
    // Lessons: module_id SET NULL via FK; course_id unchanged.
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return { ok: false, error: message }
  }
}

/** Deterministic student/admin grouping helper (pure). */
export function groupLessonsByModule<T extends { id: string; module_id?: string | null; sort_order: number }>(
  modules: Array<{ id: string; title: string; sortOrder: number }>,
  lessons: T[]
): Array<{ moduleId: string | null; title: string; lessons: T[] }> {
  const sortedLessons = [...lessons].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    return a.id.localeCompare(b.id)
  })
  const sortedModules = [...modules].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.id.localeCompare(b.id)
  })

  const byModule = new Map<string, T[]>()
  const ungrouped: T[] = []
  for (const lesson of sortedLessons) {
    const mid = lesson.module_id != null ? String(lesson.module_id) : ''
    if (!mid) {
      ungrouped.push(lesson)
      continue
    }
    byModule.set(mid, [...(byModule.get(mid) ?? []), lesson])
  }

  const groups: Array<{ moduleId: string | null; title: string; lessons: T[] }> = []
  for (const mod of sortedModules) {
    const moduleLessons = byModule.get(mod.id) ?? []
    if (!moduleLessons.length) continue
    groups.push({
      moduleId: mod.id,
      title: mod.title,
      lessons: moduleLessons,
    })
  }
  if (ungrouped.length || groups.length === 0) {
    groups.push({ moduleId: null, title: 'Ungrouped', lessons: ungrouped })
  }
  return groups
}
