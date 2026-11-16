import { NextResponse } from 'next/server'
import {
  clonePublishedLearningPlanToDraft,
  ensureDraftLearningPlan,
  listCurriculumActivitiesForPlan,
  listLearningPlanTemplates,
  publishLearningPlan,
  saveDraftLearningPlan,
  type LearningPlanDayInput,
} from '@/lib/learning/learning-plan-template'

function statusForError(error: string): number {
  if (error === 'Unauthorized') return 401
  if (error === 'Forbidden') return 403
  return 400
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params
  const [templatesResult, activitiesResult] = await Promise.all([
    listLearningPlanTemplates(courseId),
    listCurriculumActivitiesForPlan(courseId),
  ])

  if (!templatesResult.ok) {
    return NextResponse.json(templatesResult, { status: statusForError(templatesResult.error) })
  }
  if (!activitiesResult.ok) {
    return NextResponse.json(activitiesResult, { status: statusForError(activitiesResult.error) })
  }

  return NextResponse.json({
    ok: true,
    templates: templatesResult.templates,
    activities: activitiesResult.activities,
    warning: templatesResult.warning || activitiesResult.warning,
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const action = String(body.action ?? 'ensure_draft')

  if (action === 'ensure_draft') {
    const result = await ensureDraftLearningPlan(
      courseId,
      body.title != null ? String(body.title) : 'Daily learning plan'
    )
    if (!result.ok) return NextResponse.json(result, { status: statusForError(result.error) })
    return NextResponse.json(result, { status: 201 })
  }

  if (action === 'save_draft') {
    const days = (Array.isArray(body.days) ? body.days : []) as LearningPlanDayInput[]
    const result = await saveDraftLearningPlan(courseId, {
      templateId: String(body.templateId ?? ''),
      title: body.title != null ? String(body.title) : undefined,
      notes: body.notes != null ? String(body.notes) : undefined,
      days,
    })
    if (!result.ok) return NextResponse.json(result, { status: statusForError(result.error) })
    return NextResponse.json(result)
  }

  if (action === 'publish') {
    const result = await publishLearningPlan(courseId, String(body.templateId ?? ''))
    if (!result.ok) return NextResponse.json(result, { status: statusForError(result.error) })
    return NextResponse.json(result)
  }

  if (action === 'clone_to_draft') {
    const result = await clonePublishedLearningPlanToDraft(
      courseId,
      String(body.templateId ?? body.sourceTemplateId ?? '')
    )
    if (!result.ok) return NextResponse.json(result, { status: statusForError(result.error) })
    return NextResponse.json(result, { status: 201 })
  }

  return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 })
}
