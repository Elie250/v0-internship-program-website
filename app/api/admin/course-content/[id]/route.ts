import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { updateCourseLesson } from '@/lib/learning/course-content-mutations'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
    const { id } = await params
    const body = await request.json()
    const { lesson, error } = await updateCourseLesson({
      lessonId: id,
      title: body.title != null ? String(body.title) : undefined,
      contentType: body.content_type != null ? String(body.content_type) : undefined,
      contentUrl: body.content_url !== undefined ? body.content_url : undefined,
      lessonBody: 'body' in body ? body.body : undefined,
      visibility: 'visibility' in body ? (body.visibility != null ? String(body.visibility) : null) : undefined,
      estimatedMinutes:
        body.estimated_minutes !== undefined || body.estimatedMinutes !== undefined
          ? (body.estimated_minutes ?? body.estimatedMinutes)
          : undefined,
      activityKind:
        body.activity_kind !== undefined || body.activityKind !== undefined
          ? (body.activity_kind ?? body.activityKind)
          : undefined,
      moduleId: 'module_id' in body || 'moduleId' in body ? (body.module_id ?? body.moduleId ?? null) : undefined,
      unlockAt: 'unlock_at' in body || 'unlockAt' in body ? (body.unlock_at ?? body.unlockAt ?? null) : undefined,
      unlockAfterContentId:
        'unlock_after_content_id' in body || 'unlockAfterContentId' in body
          ? (body.unlock_after_content_id ?? body.unlockAfterContentId ?? null)
          : undefined,
    })

    if (error) return NextResponse.json({ error }, { status: 400 })
    return NextResponse.json(lesson)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update content'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await params
    const { error } = await supabaseAdmin.from('course_content').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete content'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
