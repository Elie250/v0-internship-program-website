import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerSession } from '@/lib/lecturer/access'
import { normalizeCourseRow } from '@/lib/platform/courses'

export async function GET() {
  try {
    const user = await requireLecturerSession()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const courses = (data ?? []).map((row) =>
      normalizeCourseRow(row as Record<string, unknown> & { id: string; title: string })
    )

    const courseIds = courses.map((c) => c.id)
    let enrollmentStats = new Map<string, { total: number; admitted: number; pending: number }>()

    if (courseIds.length) {
      const { data: enrollments } = await supabaseAdmin
        .from('course_enrollments')
        .select('course_id, status')
        .in('course_id', courseIds)

      for (const row of enrollments ?? []) {
        const courseId = String(row.course_id)
        const current = enrollmentStats.get(courseId) ?? { total: 0, admitted: 0, pending: 0 }
        current.total += 1
        if (row.status === 'admitted') current.admitted += 1
        if (row.status === 'payment_pending_review') current.pending += 1
        enrollmentStats.set(courseId, current)
      }
    }

    return NextResponse.json(
      courses.map((course) => ({
        ...course,
        enrollment_stats: enrollmentStats.get(course.id) ?? { total: 0, admitted: 0, pending: 0 },
      }))
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load courses'
    const status = message === 'Unauthorized' || message.includes('Lecturer') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
