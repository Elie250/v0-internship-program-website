import type { SupabaseClient } from '@supabase/supabase-js'
import type { ContentStatus, Course, Category } from '@/types/platform'
import { normalizeProgramType } from '@/lib/enrollment/program-types'

type CourseRow = Record<string, unknown> & {
  id: string
  title: string
  status?: string | null
  is_published?: boolean | null
  category_id?: string | null
}

export function resolveCourseStatus(row: CourseRow): ContentStatus {
  const status = row.status
  if (status === 'published' || status === 'draft' || status === 'archived') {
    return status
  }
  if (row.is_published === true) return 'published'
  if (row.is_published === false) return 'draft'
  return 'draft'
}

export function normalizeCourseRow(row: CourseRow): Course {
  const status = resolveCourseStatus(row)
  return {
    id: String(row.id),
    title: String(row.title),
    description: (row.description as string | null) ?? null,
    category_id: (row.category_id as string | null) ?? null,
    thumbnail: (row.thumbnail as string | null) ?? null,
    instructor_id: (row.instructor_id as string | null) ?? null,
    difficulty: (row.difficulty as string | null) ?? null,
    duration: (row.duration as string | null) ?? null,
    pricing: row.pricing != null ? Number(row.pricing) : null,
    status,
    program: (row.program as string | null) ?? (row.difficulty as string | null) ?? null,
    program_type: normalizeProgramType(row.program_type),
    scheduled_at: (row.scheduled_at as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    meeting_link: (row.meeting_link as string | null) ?? null,
    program_start_date: (row.program_start_date as string | null) ?? null,
    program_end_date: (row.program_end_date as string | null) ?? null,
    default_access_days:
      row.default_access_days != null ? Number(row.default_access_days) : null,
    max_seats: row.max_seats != null ? Number(row.max_seats) : null,
  }
}

export function isCoursePublished(row: CourseRow | Course): boolean {
  return resolveCourseStatus(row as CourseRow) === 'published'
}

export async function attachCourseCategories(
  client: SupabaseClient,
  courses: Course[]
): Promise<Course[]> {
  const categoryIds = [...new Set(courses.map((c) => c.category_id).filter(Boolean))] as string[]
  if (!categoryIds.length) return courses

  const { data: categories } = await client
    .from('categories')
    .select('*')
    .in('id', categoryIds)

  const byId = new Map((categories ?? []).map((cat) => [cat.id, cat as Category]))
  return courses.map((course) => ({
    ...course,
    category: course.category_id ? byId.get(course.category_id) ?? null : null,
  }))
}
