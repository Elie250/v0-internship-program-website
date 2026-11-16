import { NextResponse } from 'next/server'
import {
  createCourseModule,
  deleteCourseModule,
  listCourseModules,
  reorderCourseModules,
  updateCourseModule,
} from '@/lib/learning/course-modules'

function statusFor(error: string): number {
  if (error === 'Unauthorized') return 401
  if (error === 'Forbidden') return 403
  return 400
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params
  const result = await listCourseModules(courseId, 'lecturer')
  if (!result.ok) return NextResponse.json(result, { status: statusFor(result.error) })
  return NextResponse.json(result)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const action = String(body.action ?? 'create')

  if (action === 'create') {
    const result = await createCourseModule(
      courseId,
      { title: String(body.title ?? ''), summary: body.summary != null ? String(body.summary) : null },
      'lecturer'
    )
    if (!result.ok) return NextResponse.json(result, { status: statusFor(result.error) })
    return NextResponse.json(result, { status: 201 })
  }

  if (action === 'update') {
    const result = await updateCourseModule(
      courseId,
      String(body.moduleId ?? ''),
      {
        title: body.title != null ? String(body.title) : undefined,
        summary: body.summary !== undefined ? (body.summary != null ? String(body.summary) : null) : undefined,
        sortOrder: body.sortOrder != null ? Number(body.sortOrder) : undefined,
      },
      'lecturer'
    )
    if (!result.ok) return NextResponse.json(result, { status: statusFor(result.error) })
    return NextResponse.json(result)
  }

  if (action === 'reorder') {
    const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds.map(String) : []
    const result = await reorderCourseModules(courseId, orderedIds, 'lecturer')
    if (!result.ok) return NextResponse.json(result, { status: statusFor(result.error) })
    return NextResponse.json(result)
  }

  if (action === 'delete') {
    const result = await deleteCourseModule(courseId, String(body.moduleId ?? ''), 'lecturer')
    if (!result.ok) return NextResponse.json(result, { status: statusFor(result.error) })
    return NextResponse.json(result)
  }

  return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 })
}
