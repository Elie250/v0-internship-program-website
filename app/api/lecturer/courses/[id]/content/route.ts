import { NextResponse } from 'next/server'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import {
  insertCourseLesson,
  listCourseLessons,
} from '@/lib/learning/course-content-mutations'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requireLecturerCourseAccess(id)

    const { lessons, error } = await listCourseLessons(id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json(lessons)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load lessons'
    const status =
      message === 'Unauthorized' || message.includes('not assigned') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    await requireLecturerCourseAccess(courseId)

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
    const message = error instanceof Error ? error.message : 'Failed to add lesson'
    const status =
      message === 'Unauthorized' || message.includes('not assigned') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
