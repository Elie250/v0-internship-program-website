import { NextResponse } from 'next/server'
import {
  createCurriculumOutcome,
  deleteCurriculumOutcome,
  listCurriculumOutcomes,
  updateCurriculumOutcome,
  type OutcomeScope,
} from '@/lib/learning/curriculum-outcomes'

function statusFor(error: string): number {
  if (error === 'Unauthorized') return 401
  if (error === 'Forbidden') return 403
  return 400
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params
  const url = new URL(request.url)
  const scope = url.searchParams.get('scope') as OutcomeScope | null
  const moduleId = url.searchParams.get('moduleId') ?? undefined
  const contentId = url.searchParams.get('contentId') ?? undefined
  const result = await listCurriculumOutcomes(
    courseId,
    {
      scope: scope || undefined,
      moduleId,
      contentId,
    },
    'admin'
  )
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
    const result = await createCurriculumOutcome(
      courseId,
      {
        scope: String(body.scope ?? ''),
        statement: String(body.statement ?? ''),
        code: body.code != null ? String(body.code) : null,
        successCriteria: body.successCriteria != null ? String(body.successCriteria) : null,
        moduleId: body.moduleId != null ? String(body.moduleId) : null,
        contentId: body.contentId != null ? String(body.contentId) : null,
        sortOrder: body.sortOrder != null ? Number(body.sortOrder) : undefined,
      },
      'admin'
    )
    if (!result.ok) return NextResponse.json(result, { status: statusFor(result.error) })
    return NextResponse.json(result, { status: 201 })
  }

  if (action === 'update') {
    const result = await updateCurriculumOutcome(
      courseId,
      String(body.outcomeId ?? ''),
      {
        statement: body.statement != null ? String(body.statement) : undefined,
        code: body.code !== undefined ? (body.code != null ? String(body.code) : null) : undefined,
        successCriteria:
          body.successCriteria !== undefined
            ? body.successCriteria != null
              ? String(body.successCriteria)
              : null
            : undefined,
        sortOrder: body.sortOrder != null ? Number(body.sortOrder) : undefined,
      },
      'admin'
    )
    if (!result.ok) return NextResponse.json(result, { status: statusFor(result.error) })
    return NextResponse.json(result)
  }

  if (action === 'delete') {
    const result = await deleteCurriculumOutcome(courseId, String(body.outcomeId ?? ''), 'admin')
    if (!result.ok) return NextResponse.json(result, { status: statusFor(result.error) })
    return NextResponse.json(result)
  }

  return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 })
}
