import { NextResponse } from 'next/server'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import {
  createPracticalAssessment,
  listPracticalAssessments,
} from '@/lib/learning/practical-assessment-service'
import {
  isPracticalKind,
  rubricInputSchema,
  type PracticalKind,
} from '@/lib/learning/practical-assessments'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    await requireLecturerCourseAccess(courseId)
    const { assessments, error } = await listPracticalAssessments(courseId)
    if (error) return NextResponse.json({ error }, { status: 503 })
    return NextResponse.json({ assessments })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load practicals'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const { user } = await requireLecturerCourseAccess(courseId)
    const body = await request.json().catch(() => ({}))

    const title = String(body.title ?? '').trim()
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const kind = String(body.assessment_kind ?? body.kind ?? 'practical_task')
    if (!isPracticalKind(kind)) {
      return NextResponse.json({ error: 'Invalid practical assessment kind' }, { status: 400 })
    }

    let rubric = null
    if (body.rubric != null) {
      const parsed = rubricInputSchema.safeParse(body.rubric)
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'Invalid rubric' },
          { status: 400 }
        )
      }
      rubric = parsed.data
    }

    const result = await createPracticalAssessment({
      courseId,
      createdBy: user.id,
      title,
      description: body.description ?? null,
      kind: kind as PracticalKind,
      passingScore: body.passing_score ?? body.passingScore,
      dueAt: body.due_at ?? body.dueAt ?? null,
      estimatedMinutes: body.estimated_minutes ?? body.estimatedMinutes ?? null,
      activityKind: body.activity_kind ?? body.activityKind ?? 'practical',
      brief: body.practical_brief ?? body.brief,
      rubric,
      outcomeIds: Array.isArray(body.outcome_ids)
        ? body.outcome_ids.map(String)
        : Array.isArray(body.outcomeIds)
          ? body.outcomeIds.map(String)
          : [],
      publish: body.is_published === true || body.publish === true,
    })

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json(
      { assessment: result.assessment, warnings: result.warnings },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create practical'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
