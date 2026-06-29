import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerSession } from '@/lib/lecturer/access'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireLecturerSession()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await params

    const { data: lesson, error: fetchError } = await supabaseAdmin
      .from('course_content')
      .select('id, course_id')
      .eq('id', id)
      .maybeSingle()

    if (fetchError || !lesson) {
      return NextResponse.json({ error: fetchError?.message ?? 'Lesson not found' }, { status: 404 })
    }

    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('instructor_id')
      .eq('id', lesson.course_id)
      .maybeSingle()

    if (!course || String(course.instructor_id) !== String(user.id)) {
      return NextResponse.json({ error: 'You cannot edit this lesson' }, { status: 403 })
    }

    const { error } = await supabaseAdmin.from('course_content').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete lesson'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
