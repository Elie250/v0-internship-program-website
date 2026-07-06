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

    const { data, error } = await supabaseAdmin
      .from('lab_submissions')
      .select('*, course_enrollments(applicant_name, applicant_email)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })

    if (error && MISSING.test(error.message)) return NextResponse.json([])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const { user } = await requireLecturerCourseAccess(courseId)
    if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

    const body = await request.json()
    const submissionId = String(body.submissionId ?? '')
    const status = String(body.status ?? 'reviewed')
    if (!submissionId) return NextResponse.json({ error: 'submissionId required' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('lab_submissions')
      .update({
        status: status === 'resubmit' ? 'resubmit' : 'reviewed',
        lecturer_feedback: body.feedback ? String(body.feedback) : null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', submissionId)
      .eq('course_id', courseId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
