import { NextResponse } from 'next/server'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import { setLecturerAssessmentApproval } from '@/lib/learning/completion'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    await requireLecturerCourseAccess(courseId)

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: assessments } = await supabaseAdmin
      .from('course_assessments')
      .select('id, title, passing_score')
      .eq('course_id', courseId)

    const assessmentIds = (assessments ?? []).map((a) => a.id)
    if (!assessmentIds.length) return NextResponse.json([])

    const { data: submissions, error } = await supabaseAdmin
      .from('assessment_submissions')
      .select(
        'id, score, passed, lecturer_approved, admin_confirmed, submitted_at, enrollment:course_enrollments(applicant_name, applicant_email, course_id)'
      )
      .in('assessment_id', assessmentIds)
      .order('submitted_at', { ascending: false })

    if (error) {
      if (error.message.includes('assessment_submissions')) return NextResponse.json([])
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(submissions ?? [])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    await requireLecturerCourseAccess(courseId)

    const body = await request.json()
    const submissionId = String(body.submissionId ?? '')
    const approved = body.approved === true

    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId required' }, { status: 400 })
    }

    const result = await setLecturerAssessmentApproval({
      submissionId,
      approved,
      notes: body.notes,
    })

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
