import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerSession } from '@/lib/lecturer/access'
import { normalizeCourseRow } from '@/lib/platform/courses'
import { normalizeProgramType } from '@/lib/enrollment/program-types'

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
    let certStats = new Map<string, number>()

    if (courseIds.length) {
      const [enrollmentsResult, certsResult] = await Promise.all([
        supabaseAdmin
          .from('course_enrollments')
          .select('course_id, status')
          .in('course_id', courseIds),
        supabaseAdmin
          .from('student_certificates')
          .select('course_id')
          .in('course_id', courseIds)
          .eq('status', 'pending_admin'),
      ])

      for (const row of enrollmentsResult.data ?? []) {
        const courseId = String(row.course_id)
        const current = enrollmentStats.get(courseId) ?? { total: 0, admitted: 0, pending: 0 }
        current.total += 1
        if (row.status === 'admitted') current.admitted += 1
        if (row.status === 'payment_pending_review') current.pending += 1
        enrollmentStats.set(courseId, current)
      }

      for (const row of certsResult.data ?? []) {
        const courseId = String(row.course_id)
        certStats.set(courseId, (certStats.get(courseId) ?? 0) + 1)
      }
    }

    return NextResponse.json(
      courses.map((course) => {
        const stats = enrollmentStats.get(course.id) ?? { total: 0, admitted: 0, pending: 0 }
        const pendingCerts = certStats.get(course.id) ?? 0
        const notification_count =
          (course.status === 'pending_review' ? 1 : 0) + stats.pending + pendingCerts
        return {
          ...course,
          enrollment_stats: stats,
          pending_certificates: pendingCerts,
          notification_count,
        }
      })
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load courses'
    const status = message === 'Unauthorized' || message.includes('Lecturer') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireLecturerSession()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const title = String(body.title ?? '').trim()
    if (!title) {
      return NextResponse.json({ error: 'Program title is required' }, { status: 400 })
    }

    const program = String(body.program || body.difficulty || '').trim()
    const programType = normalizeProgramType(body.program_type)

    const payload = {
      title,
      description: body.description != null ? String(body.description).trim() || null : null,
      duration: body.duration != null ? String(body.duration).trim() || null : null,
      thumbnail: body.thumbnail || body.image_url || null,
      difficulty: program || null,
      program: program || null,
      program_type: programType,
      pricing: body.pricing != null ? Number(body.pricing) : 0,
      status: 'pending_review',
      scheduled_at: body.scheduled_at || null,
      location: body.location || null,
      meeting_link: body.meeting_link || null,
      program_end_date: body.program_end_date || null,
      instructor_id: user.id,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin.from('courses').insert([payload]).select().single()
    if (error) {
      if (error.message.includes('pending_review') || error.message.includes('courses_status_check')) {
        return NextResponse.json(
          {
            error:
              'Pending review status is not in the database yet. Run scripts/52-course-pending-review.sql in Supabase.',
          },
          { status: 500 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(normalizeCourseRow(data as Record<string, unknown> & { id: string; title: string }), {
      status: 201,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create programme'
    const status = message === 'Unauthorized' || message.includes('Lecturer') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
