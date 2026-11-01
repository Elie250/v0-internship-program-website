import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseLessonBody, type LessonBlock } from '@/lib/learning/lesson-blocks'
import {
  filterPublishedLessonRows,
  isMissingLessonSchemaColumn,
} from '@/lib/learning/lesson-visibility'

export type PublishedLessonRow = {
  id: string
  course_id: string
  title: string
  content_type: string
  content_url: string | null
  sort_order: number
  unlock_at?: string | null
  unlock_after_content_id?: string | null
  body: LessonBlock[]
  module_id?: string | null
}

const STUDENT_LESSON_SELECTS = [
  'id, course_id, title, content_type, content_url, sort_order, unlock_at, unlock_after_content_id, body, visibility, module_id',
  'id, course_id, title, content_type, content_url, sort_order, unlock_at, unlock_after_content_id, body, visibility',
  'id, course_id, title, content_type, content_url, sort_order, unlock_at, unlock_after_content_id',
  'id, course_id, title, content_type, content_url, sort_order',
] as const

function mapPublishedRows(rows: Record<string, unknown>[]): PublishedLessonRow[] {
  return filterPublishedLessonRows(rows).map((row) => ({
    id: String(row.id),
    course_id: String(row.course_id),
    title: String(row.title ?? ''),
    content_type: String(row.content_type ?? 'link'),
    content_url: row.content_url != null ? String(row.content_url) : null,
    sort_order: Number(row.sort_order ?? 0),
    unlock_at: (row.unlock_at as string | null) ?? null,
    unlock_after_content_id: (row.unlock_after_content_id as string | null) ?? null,
    body: parseLessonBody(row.body),
    module_id: row.module_id != null ? String(row.module_id) : null,
  }))
}

export async function queryPublishedCourseLessons(courseIds: string[]): Promise<PublishedLessonRow[]> {
  if (!supabaseAdmin || courseIds.length === 0) return []

  let lastError: string | null = null
  for (const columns of STUDENT_LESSON_SELECTS) {
    const { data, error } = await supabaseAdmin
      .from('course_content')
      .select(columns as string)
      .in('course_id', courseIds)
      .order('sort_order', { ascending: true })

    if (!error) {
      return mapPublishedRows((data ?? []) as unknown as Record<string, unknown>[])
    }
    lastError = error.message
    if (!isMissingLessonSchemaColumn(error.message)) {
      throw new Error(error.message)
    }
  }

  if (lastError) throw new Error(lastError)
  return []
}

export async function queryPublishedLessonIds(courseId: string): Promise<string[]> {
  const lessons = await queryPublishedCourseLessons([courseId])
  return lessons.map((lesson) => lesson.id)
}
