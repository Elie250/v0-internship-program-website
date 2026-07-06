import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'

const MISSING = /relation .* does not exist|could not find the table/i

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    await requireLecturerCourseAccess(courseId)
    if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('course_session_attendance')
      .select('*, course_enrollments(applicant_name, applicant_email)')
      .eq('session_id', sessionId)

    if (error && MISSING.test(error.message)) return NextResponse.json([])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const { user } = await requireLecturerCourseAccess(courseId)
    if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

    const body = await request.json()
    const sessionId = String(body.sessionId ?? '')
    const records = Array.isArray(body.records) ? body.records : []
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

    for (const row of records) {
      const enrollmentId = String(row.enrollmentId ?? '')
      const status = String(row.status ?? 'present')
      if (!enrollmentId) continue

      await supabaseAdmin.from('course_session_attendance').upsert(
        {
          session_id: sessionId,
          enrollment_id: enrollmentId,
          user_id: row.userId ? String(row.userId) : null,
          status: ['present', 'absent', 'excused'].includes(status) ? status : 'present',
          marked_by: user.id,
          self_checked_in: false,
          marked_at: new Date().toISOString(),
        },
        { onConflict: 'session_id,enrollment_id' }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
