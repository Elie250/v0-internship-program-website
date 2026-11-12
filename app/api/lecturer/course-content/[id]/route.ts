import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerCourseAccess, requireLecturerSession } from '@/lib/lecturer/access'
import { updateCourseLesson } from '@/lib/learning/course-content-mutations'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    await requireLecturerCourseAccess(lesson.course_id)

    const body = await request.json()
    const { lesson: updated, error } = await updateCourseLesson({
      lessonId: id,
      title: body.title != null ? String(body.title) : undefined,
      contentType: body.content_type != null ? String(body.content_type) : undefined,
      contentUrl: body.content_url !== undefined ? body.content_url : undefined,
      lessonBody: 'body' in body ? body.body : undefined,
      visibility: body.visibility != null ? String(body.visibility) : undefined,
      estimatedMinutes:
        body.estimated_minutes !== undefined || body.estimatedMinutes !== undefined
          ? (body.estimated_minutes ?? body.estimatedMinutes)
          : undefined,
      activityKind:
        body.activity_kind !== undefined || body.activityKind !== undefined
          ? (body.activity_kind ?? body.activityKind)
          : undefined,
    })

    if (error) return NextResponse.json({ error }, { status: 400 })
    return NextResponse.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update lesson'
    const status =
      message === 'Unauthorized' || message.includes('not assigned') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

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
