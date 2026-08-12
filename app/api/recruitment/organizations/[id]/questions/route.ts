import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { JOB_READ_ROLES, SCREENING_WRITE_ROLES, roleAllows } from '@/lib/recruitment/rbac'
import {
  createOrganizationQuestion,
  listAvailableQuestions,
} from '@/lib/recruitment/questions'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await context.params
    await requireOrganizationAccess(organizationId, JOB_READ_ROLES)
    const { questions, error } = await listAvailableQuestions(organizationId)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ questions })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, SCREENING_WRITE_ROLES)
    if (!roleAllows(access.asPlatformAdmin, access.membership?.role, SCREENING_WRITE_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await request.json()
    const result = await createOrganizationQuestion({
      organizationId,
      actorUserId: access.user.id,
      prompt: String(body.prompt ?? ''),
      discipline: body.discipline != null ? String(body.discipline) : undefined,
      difficulty: body.difficulty != null ? String(body.difficulty) : undefined,
      expectedTimeSeconds:
        body.expectedTimeSeconds != null ? Number(body.expectedTimeSeconds) : null,
      answerKey: body.answerKey != null ? String(body.answerKey) : null,
      questionType: body.questionType != null ? String(body.questionType) : undefined,
      options: body.options,
      parameters: body.parameters,
      answerSpec: body.answerSpec,
      weight: body.weight != null ? Number(body.weight) : undefined,
      section: body.section != null ? String(body.section) : undefined,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ question: result.question })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
