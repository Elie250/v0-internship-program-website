import { NextResponse } from 'next/server'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import {
  getPracticalAssessment,
  updatePracticalAssessment,
} from '@/lib/learning/practical-assessment-service'
import {
  isPracticalKind,
  rubricInputSchema,
  type PracticalKind,
} from '@/lib/learning/practical-assessments'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; assessmentId: string }> }
) {
  try {
    const { id: courseId, assessmentId } = await params
    await requireLecturerCourseAccess(courseId)
    const { assessment, error } = await getPracticalAssessment(assessmentId, { courseId })
    if (error) return NextResponse.json({ error }, { status: 503 })
    if (!assessment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ assessment })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load practical'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; assessmentId: string }> }
) {
  try {
    const { id: courseId, assessmentId } = await params
    await requireLecturerCourseAccess(courseId)
    const body = await request.json().catch(() => ({}))

    let rubric = undefined as ReturnType<typeof rubricInputSchema.parse> | null | undefined
    if (body.rubric !== undefined) {
      if (body.rubric == null) {
        rubric = null
      } else {
        const parsed = rubricInputSchema.safeParse(body.rubric)
        if (!parsed.success) {
          return NextResponse.json(
            { error: parsed.error.issues[0]?.message || 'Invalid rubric' },
            { status: 400 }
          )
        }
        rubric = parsed.data
      }
    }

    const kindRaw = body.assessment_kind ?? body.kind
    if (kindRaw != null && !isPracticalKind(kindRaw)) {
      return NextResponse.json({ error: 'Invalid practical assessment kind' }, { status: 400 })
    }

    const result = await updatePracticalAssessment({
      courseId,
      assessmentId,
      title: body.title,
      description: body.description,
      kind: kindRaw as PracticalKind | undefined,
      passingScore: body.passing_score ?? body.passingScore,
      dueAt: body.due_at ?? body.dueAt,
      estimatedMinutes: body.estimated_minutes ?? body.estimatedMinutes,
      activityKind: body.activity_kind ?? body.activityKind,
      brief: body.practical_brief ?? body.brief,
      rubric,
      outcomeIds: Array.isArray(body.outcome_ids)
        ? body.outcome_ids.map(String)
        : Array.isArray(body.outcomeIds)
          ? body.outcomeIds.map(String)
          : undefined,
      isPublished: body.is_published ?? body.isPublished,
    })

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ assessment: result.assessment, warnings: result.warnings })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update practical'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
