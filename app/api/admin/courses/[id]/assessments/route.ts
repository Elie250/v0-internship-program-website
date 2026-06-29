import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_STUDENTS)
    const { id: courseId } = await params

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: assessments } = await supabaseAdmin
      .from('course_assessments')
      .select('id')
      .eq('course_id', courseId)

    const assessmentIds = (assessments ?? []).map((a) => a.id)
    if (!assessmentIds.length) return NextResponse.json([])

    const { data, error } = await supabaseAdmin
      .from('assessment_submissions')
      .select(
        'id, score, passed, lecturer_approved, admin_confirmed, enrollment:course_enrollments(applicant_name, course_id)'
      )
      .in('assessment_id', assessmentIds)

    if (error) {
      if (error.message.includes('assessment_submissions')) return NextResponse.json([])
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
