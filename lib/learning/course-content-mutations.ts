import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { INTERACTIVE_CONTENT_TYPE } from '@/lib/learning/course-content-types'
import {
  parseActivityKindInput,
  parseEstimatedMinutesInput,
  type ActivityKind,
} from '@/lib/learning/curriculum-workload'
import { validateDripPrerequisite } from '@/lib/learning/drip-graph'
import {
  normalizeLessonAuthoringInput,
  validateLessonForPublish,
  type NormalizedLessonAuthoring,
} from '@/lib/learning/lesson-authoring'
import { isMissingLessonSchemaColumn } from '@/lib/learning/lesson-visibility'

export type CourseLessonRow = {
  id: string
  course_id: string
  title: string
  content_type: string
  content_url: string | null
  sort_order: number
  created_at?: string
  body?: unknown
  visibility?: string | null
  module_id?: string | null
  unlock_at?: string | null
  unlock_after_content_id?: string | null
  estimated_minutes?: number | null
  activity_kind?: ActivityKind | null
}

function authoringErrorForSchema(message: string, contentType: string): string {
  if (contentType === INTERACTIVE_CONTENT_TYPE || /visibility|body|interactive/i.test(message)) {
    return 'Interactive lessons need scripts/95-lesson-blocks-and-modules.sql applied in Supabase.'
  }
  if (message.includes('content_type')) {
    return 'This material type is not enabled in the database. Run scripts/21-course-content-webinar.sql in Supabase.'
  }
  return message
}

function persistableLessonFields(
  value: NormalizedLessonAuthoring,
  workload?: { estimatedMinutes?: number | null; activityKind?: ActivityKind | null }
) {
  return {
    title: value.title,
    content_type: value.contentType,
    content_url: value.contentUrl,
    body: value.body,
    visibility: value.visibility,
    ...(workload && 'estimatedMinutes' in workload
      ? { estimated_minutes: workload.estimatedMinutes ?? null }
      : {}),
    ...(workload && 'activityKind' in workload ? { activity_kind: workload.activityKind ?? null } : {}),
  }
}

function parseLessonWorkload(input: {
  estimatedMinutes?: unknown
  activityKind?: unknown
}): { ok: true; estimatedMinutes?: number | null; activityKind?: ActivityKind | null } | { ok: false; error: string } {
  const result: { estimatedMinutes?: number | null; activityKind?: ActivityKind | null } = {}
  if (input.estimatedMinutes !== undefined) {
    const minutes = parseEstimatedMinutesInput(input.estimatedMinutes)
    if (!minutes.ok) return minutes
    result.estimatedMinutes = minutes.minutes
  }
  if (input.activityKind !== undefined) {
    const kind = parseActivityKindInput(input.activityKind)
    if (!kind.ok) return kind
    result.activityKind = kind.kind
  }
  return { ok: true, ...result }
}

export async function listCourseLessons(courseId: string): Promise<{
  lessons: CourseLessonRow[]
  error?: string
}> {
  if (!supabaseAdmin) return { lessons: [], error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('course_content')
    .select('*')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })

  if (error) return { lessons: [], error: error.message }
  return { lessons: (data ?? []) as CourseLessonRow[] }
}

async function resolvePlacementFields(input: {
  courseId: string
  lessonId?: string
  moduleId?: string | null
  unlockAt?: string | null
  unlockAfterContentId?: string | null
  patchModule?: boolean
  patchUnlockAt?: boolean
  patchUnlockAfter?: boolean
}): Promise<{ ok: true; patch: Record<string, unknown> } | { ok: false; error: string }> {
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured' }
  const patch: Record<string, unknown> = {}

  if (input.patchModule) {
    if (input.moduleId) {
      const { data: mod } = await supabaseAdmin
        .from('course_modules')
        .select('id')
        .eq('id', input.moduleId)
        .eq('course_id', input.courseId)
        .maybeSingle()
      if (!mod) return { ok: false, error: 'Module not found on this course.' }
      patch.module_id = input.moduleId
    } else {
      patch.module_id = null
    }
  }

  if (input.patchUnlockAt) {
    if (input.unlockAt == null || String(input.unlockAt).trim() === '') {
      patch.unlock_at = null
    } else {
      const ms = new Date(String(input.unlockAt)).getTime()
      if (Number.isNaN(ms)) return { ok: false, error: 'unlock_at must be a valid date/time.' }
      patch.unlock_at = new Date(ms).toISOString()
    }
  }

  if (input.patchUnlockAfter) {
    const prerequisiteId =
      input.unlockAfterContentId == null || String(input.unlockAfterContentId).trim() === ''
        ? null
        : String(input.unlockAfterContentId)
    const { data: siblings } = await supabaseAdmin
      .from('course_content')
      .select('id, unlock_after_content_id, visibility')
      .eq('course_id', input.courseId)
    const edges = (siblings ?? []).map((row) => ({
      id: String(row.id),
      unlockAfterContentId:
        row.unlock_after_content_id != null ? String(row.unlock_after_content_id) : null,
      visibility: row.visibility != null ? String(row.visibility) : null,
    }))
    const lessonId = input.lessonId ?? '__new__'
    const drip = validateDripPrerequisite({
      lessons: edges,
      lessonId,
      prerequisiteId,
      requirePublishedPrerequisite: true,
    })
    if (!drip.ok) return drip
    patch.unlock_after_content_id = prerequisiteId
  }

  return { ok: true, patch }
}

export async function insertCourseLesson(input: {
  courseId: string
  title: string
  contentType: string
  contentUrl?: string | null
  sortOrder?: number
  lessonBody?: unknown
  /** Omit / null / '' → type default (interactive=draft, URL types=published). */
  visibility?: string | null
  estimatedMinutes?: unknown
  activityKind?: unknown
  moduleId?: string | null
  unlockAt?: string | null
  unlockAfterContentId?: string | null
}): Promise<{ lesson?: CourseLessonRow; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const normalized = normalizeLessonAuthoringInput({
    title: input.title,
    contentType: input.contentType,
    contentUrl: input.contentUrl,
    body: input.lessonBody ?? [],
    visibility: input.visibility,
  })
  if (!normalized.ok) return { error: normalized.error }

  const workload = parseLessonWorkload({
    estimatedMinutes: input.estimatedMinutes,
    activityKind: input.activityKind,
  })
  if (!workload.ok) return { error: workload.error }

  if (normalized.value.visibility === 'published') {
    const publishable = validateLessonForPublish(normalized.value)
    if (!publishable.ok) return { error: publishable.error }
  }

  let sortOrder = input.sortOrder
  if (sortOrder == null || Number.isNaN(sortOrder)) {
    const { data: existing } = await supabaseAdmin
      .from('course_content')
      .select('sort_order')
      .eq('course_id', input.courseId)
      .order('sort_order', { ascending: false })
      .limit(1)

    sortOrder = Number(existing?.[0]?.sort_order ?? -1) + 1
  }

  const placement = await resolvePlacementFields({
    courseId: input.courseId,
    moduleId: input.moduleId,
    unlockAt: input.unlockAt,
    unlockAfterContentId: input.unlockAfterContentId,
    patchModule: input.moduleId !== undefined,
    patchUnlockAt: input.unlockAt !== undefined,
    patchUnlockAfter: input.unlockAfterContentId !== undefined,
  })
  if (!placement.ok) return { error: placement.error }

  const authored = persistableLessonFields(normalized.value, workload)
  const { data, error } = await supabaseAdmin
    .from('course_content')
    .insert([
      {
        course_id: input.courseId,
        sort_order: sortOrder,
        ...authored,
        ...placement.patch,
      },
    ])
    .select()
    .single()

  if (!error) return { lesson: data as CourseLessonRow }

  if (/estimated_minutes|activity_kind|schema cache/i.test(error.message)) {
    const withoutWorkload = persistableLessonFields(normalized.value)
    const retry = await supabaseAdmin
      .from('course_content')
      .insert([
        {
          course_id: input.courseId,
          sort_order: sortOrder,
          ...withoutWorkload,
        },
      ])
      .select()
      .single()
    if (!retry.error) return { lesson: retry.data as CourseLessonRow }
  }

  if (
    normalized.value.contentType !== INTERACTIVE_CONTENT_TYPE &&
    isMissingLessonSchemaColumn(error.message)
  ) {
    const fallback = await supabaseAdmin
      .from('course_content')
      .insert([
        {
          course_id: input.courseId,
          title: authored.title,
          content_type: authored.content_type,
          content_url: authored.content_url,
          sort_order: sortOrder,
        },
      ])
      .select()
      .single()

    if (!fallback.error) return { lesson: fallback.data as CourseLessonRow }
    return { error: authoringErrorForSchema(fallback.error.message, authored.content_type) }
  }

  return { error: authoringErrorForSchema(error.message, authored.content_type) }
}

export async function updateCourseLesson(input: {
  lessonId: string
  title?: string
  contentType?: string
  contentUrl?: string | null
  lessonBody?: unknown
  /** Omit to preserve existing visibility (do not re-apply type defaults). */
  visibility?: string | null
  estimatedMinutes?: unknown
  activityKind?: unknown
  moduleId?: string | null
  unlockAt?: string | null
  unlockAfterContentId?: string | null
}): Promise<{ lesson?: CourseLessonRow; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('course_content')
    .select('*')
    .eq('id', input.lessonId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!existing) return { error: 'Lesson not found' }

  const normalized = normalizeLessonAuthoringInput({
    title: input.title ?? String(existing.title ?? ''),
    contentType: input.contentType ?? String(existing.content_type ?? 'link'),
    contentUrl: input.contentUrl !== undefined ? input.contentUrl : existing.content_url,
    body: input.lessonBody !== undefined ? input.lessonBody : existing.body ?? [],
    // Preserve current visibility unless the caller explicitly patches it.
    visibility: input.visibility !== undefined ? input.visibility : existing.visibility,
  })
  if (!normalized.ok) return { error: normalized.error }

  const workload = parseLessonWorkload({
    estimatedMinutes: input.estimatedMinutes,
    activityKind: input.activityKind,
  })
  if (!workload.ok) return { error: workload.error }

  if (normalized.value.visibility === 'published') {
    const publishable = validateLessonForPublish(normalized.value)
    if (!publishable.ok) return { error: publishable.error }
  }

  const placement = await resolvePlacementFields({
    courseId: String(existing.course_id),
    lessonId: input.lessonId,
    moduleId: input.moduleId,
    unlockAt: input.unlockAt,
    unlockAfterContentId: input.unlockAfterContentId,
    patchModule: input.moduleId !== undefined,
    patchUnlockAt: input.unlockAt !== undefined,
    patchUnlockAfter: input.unlockAfterContentId !== undefined,
  })
  if (!placement.ok) return { error: placement.error }

  const payload = {
    ...persistableLessonFields(normalized.value, workload),
    ...placement.patch,
  }
  const { data, error } = await supabaseAdmin
    .from('course_content')
    .update(payload)
    .eq('id', input.lessonId)
    .select()
    .single()

  if (error) {
    if (/estimated_minutes|activity_kind|module_id|unlock_at|unlock_after|schema cache/i.test(error.message)) {
      const retry = await supabaseAdmin
        .from('course_content')
        .update(persistableLessonFields(normalized.value))
        .eq('id', input.lessonId)
        .select()
        .single()
      if (!retry.error) return { lesson: retry.data as CourseLessonRow }
      return { error: authoringErrorForSchema(retry.error.message, normalized.value.contentType) }
    }
    return { error: authoringErrorForSchema(error.message, normalized.value.contentType) }
  }
  return { lesson: data as CourseLessonRow }
}

export async function deleteCourseLesson(lessonId: string): Promise<{ error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { error } = await supabaseAdmin.from('course_content').delete().eq('id', lessonId)
  if (error) return { error: error.message }
  return {}
}
