'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCurrentUser } from '@/app/actions/auth-service'
import { normalizeCourseRow } from '@/lib/platform/courses'
import type { Course } from '@/types/platform'

export async function getLecturerAssignedCourses(): Promise<
  { success: true; courses: Course[] } | { success: false; error: string }
> {
  const user = await getCurrentUser()
  if (!user?.id) {
    return { success: false, error: 'Please log in as a lecturer.' }
  }

  if (user.role !== 'lecturer' && user.role !== 'instructor') {
    return { success: false, error: 'Lecturer access only.' }
  }

  if (!supabaseAdmin) {
    return { success: false, error: 'Courses are temporarily unavailable.' }
  }

  const { data, error } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('instructor_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  const courses = (data ?? []).map((row) =>
    normalizeCourseRow(row as Record<string, unknown> & { id: string; title: string })
  )

  return { success: true, courses }
}
