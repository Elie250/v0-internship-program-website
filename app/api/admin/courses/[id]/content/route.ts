import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import {
  insertCourseLesson,
  listCourseLessons,
} from '@/lib/learning/course-content-mutations'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
    const { id } = await params
    const { lessons, error } = await listCourseLessons(id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json(lessons)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load content'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
    const { id: courseId } = await params
    const body = await request.json()
    const { lesson, error } = await insertCourseLesson({
      courseId,
      title: String(body.title ?? ''),
      contentType: String(body.content_type ?? 'link'),
      contentUrl: body.content_url ?? null,
      sortOrder: body.sort_order != null ? Number(body.sort_order) : undefined,
    })

    if (error) return NextResponse.json({ error }, { status: 400 })
    return NextResponse.json(lesson, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add content'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
