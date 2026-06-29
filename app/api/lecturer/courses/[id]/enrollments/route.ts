import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requireLecturerCourseAccess(id)

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('course_enrollments')
      .select(
        'id, applicant_name, applicant_email, applicant_phone, status, amount_due, admitted_at, access_starts_at, access_ends_at, created_at'
      )
      .eq('course_id', id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load enrollments'
    const status =
      message === 'Unauthorized' || message.includes('not assigned') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
