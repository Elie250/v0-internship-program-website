import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { INTERACTIVE_CONTENT_TYPE } from '@/lib/learning/course-content-types'
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

function persistableLessonFields(value: NormalizedLessonAuthoring) {
  return {
    title: value.title,
    content_type: value.contentType,
    content_url: value.contentUrl,
    body: value.body,
    visibility: value.visibility,
  }
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
    .order('created_at', { ascending: true })

  if (error) return { lessons: [], error: error.message }
  return { lessons: (data ?? []) as CourseLessonRow[] }
}

export async function insertCourseLesson(input: {
  courseId: string
  title: string
  contentType: string
  contentUrl?: string | null
  sortOrder?: number
  lessonBody?: unknown
  visibility?: string | null
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

  const authored = persistableLessonFields(normalized.value)
  const { data, error } = await supabaseAdmin
    .from('course_content')
    .insert([
      {
        course_id: input.courseId,
        sort_order: sortOrder,
        ...authored,
      },
    ])
    .select()
    .single()

  if (!error) return { lesson: data as CourseLessonRow }

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
  visibility?: string | null
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
    visibility: input.visibility !== undefined ? input.visibility : existing.visibility,
  })
  if (!normalized.ok) return { error: normalized.error }

  if (normalized.value.visibility === 'published') {
    const publishable = validateLessonForPublish(normalized.value)
    if (!publishable.ok) return { error: publishable.error }
  }

  const { data, error } = await supabaseAdmin
    .from('course_content')
    .update(persistableLessonFields(normalized.value))
    .eq('id', input.lessonId)
    .select()
    .single()

  if (error) return { error: authoringErrorForSchema(error.message, normalized.value.contentType) }
  return { lesson: data as CourseLessonRow }
}

export async function deleteCourseLesson(lessonId: string): Promise<{ error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { error } = await supabaseAdmin.from('course_content').delete().eq('id', lessonId)
  if (error) return { error: error.message }
  return {}
}
