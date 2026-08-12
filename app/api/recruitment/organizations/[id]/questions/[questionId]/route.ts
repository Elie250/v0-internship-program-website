import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { SCREENING_WRITE_ROLES, roleAllows } from '@/lib/recruitment/rbac'
import {
  deleteOrganizationQuestion,
  updateOrganizationQuestion,
} from '@/lib/recruitment/questions'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { id: organizationId, questionId } = await context.params
    const access = await requireOrganizationAccess(organizationId, SCREENING_WRITE_ROLES)
    if (!roleAllows(access.asPlatformAdmin, access.membership?.role, SCREENING_WRITE_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await request.json()
    const result = await updateOrganizationQuestion({
      questionId,
      organizationId,
      actorUserId: access.user.id,
      prompt: body.prompt != null ? String(body.prompt) : undefined,
      discipline: body.discipline != null ? String(body.discipline) : undefined,
      difficulty: body.difficulty != null ? String(body.difficulty) : undefined,
      expectedTimeSeconds:
        body.expectedTimeSeconds != null ? Number(body.expectedTimeSeconds) : undefined,
      answerKey: body.answerKey != null ? String(body.answerKey) : undefined,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ question: result.question })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { id: organizationId, questionId } = await context.params
    const access = await requireOrganizationAccess(organizationId, SCREENING_WRITE_ROLES)
    if (!roleAllows(access.asPlatformAdmin, access.membership?.role, SCREENING_WRITE_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const result = await deleteOrganizationQuestion({
      questionId,
      organizationId,
      actorUserId: access.user.id,
    })
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Delete failed' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
