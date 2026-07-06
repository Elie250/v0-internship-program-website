import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'

const MISSING = /relation .* does not exist|could not find the table/i

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    await requireLecturerCourseAccess(courseId)
    if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

    const { data: enrollments } = await supabaseAdmin
      .from('course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('status', 'admitted')

    const enrollmentIds = (enrollments ?? []).map((e) => e.id)
    if (!enrollmentIds.length) return NextResponse.json({ rows: [] })

    const { data, error } = await supabaseAdmin
      .from('course_session_attendance')
      .select('enrollment_id, status')
      .in('enrollment_id', enrollmentIds)

    if (error && MISSING.test(error.message)) return NextResponse.json({ rows: [] })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const counts = new Map<string, { present: number; total: number }>()
    for (const row of data ?? []) {
      const id = String(row.enrollment_id)
      const entry = counts.get(id) ?? { present: 0, total: 0 }
      entry.total += 1
      if (row.status === 'present') entry.present += 1
      counts.set(id, entry)
    }

    const rows = enrollmentIds.map((enrollmentId) => ({
      enrollmentId,
      presentCount: counts.get(enrollmentId)?.present ?? 0,
      totalCount: counts.get(enrollmentId)?.total ?? 0,
    }))

    return NextResponse.json({ rows })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
