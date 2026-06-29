import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  contentUrlPlaceholder,
  isCourseContentType,
  type CourseContentType,
} from '@/lib/learning/course-content-types'

export type CourseLessonRow = {
  id: string
  course_id: string
  title: string
  content_type: string
  content_url: string | null
  sort_order: number
  created_at?: string
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
}): Promise<{ lesson?: CourseLessonRow; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const title = input.title.trim()
  if (!title) return { error: 'Lesson title is required' }

  const contentType = isCourseContentType(input.contentType) ? input.contentType : 'link'
  const contentUrl = input.contentUrl?.trim() || null

  if (!contentUrl) {
    return {
      error: `Add a URL or upload a file (${contentUrlPlaceholder(contentType)})`,
    }
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

  const { data, error } = await supabaseAdmin
    .from('course_content')
    .insert([
      {
        course_id: input.courseId,
        title,
        content_type: contentType,
        content_url: contentUrl,
        sort_order: sortOrder,
      },
    ])
    .select()
    .single()

  if (error) {
    if (error.message.includes('content_type')) {
      return {
        error:
          'This material type is not enabled in the database. Run scripts/21-course-content-webinar.sql in Supabase.',
      }
    }
    return { error: error.message }
  }

  return { lesson: data as CourseLessonRow }
}

export async function deleteCourseLesson(lessonId: string): Promise<{ error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { error } = await supabaseAdmin.from('course_content').delete().eq('id', lessonId)
  if (error) return { error: error.message }
  return {}
}
