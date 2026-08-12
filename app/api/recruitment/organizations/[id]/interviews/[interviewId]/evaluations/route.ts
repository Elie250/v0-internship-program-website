import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { INTERVIEW_MANAGE_ROLES } from '@/lib/recruitment/rbac'
import {
  DEFAULT_INTERVIEW_CRITERIA,
  upsertInterviewEvaluation,
  listInterviewEvaluations,
} from '@/lib/recruitment/interviews'
import { interviewEvaluationAutoHires, interviewEvaluationAutoRejects } from '@/lib/recruitment/pipeline'
import { assertCanAccessInterview } from '@/lib/recruitment/job-assignments'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; interviewId: string }> }
) {
  try {
    const { id: organizationId, interviewId } = await context.params
    const access = await requireOrganizationAccess(organizationId, INTERVIEW_MANAGE_ROLES)
    await assertCanAccessInterview({ access, organizationId, interviewId })
    const { evaluations, error } = await listInterviewEvaluations(organizationId, interviewId)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({
      evaluations,
      defaultCriteria: DEFAULT_INTERVIEW_CRITERIA,
      autoHires: interviewEvaluationAutoHires(),
      autoRejects: interviewEvaluationAutoRejects(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; interviewId: string }> }
) {
  try {
    const { id: organizationId, interviewId } = await context.params
    const access = await requireOrganizationAccess(organizationId, INTERVIEW_MANAGE_ROLES)
    await assertCanAccessInterview({ access, organizationId, interviewId })
    const body = await request.json()
    const result = await upsertInterviewEvaluation({
      organizationId,
      interviewId,
      interviewerUserId: access.user.id,
      criteriaScores:
        body.criteriaScores && typeof body.criteriaScores === 'object'
          ? (body.criteriaScores as Record<string, number>)
          : {},
      overallRating: body.overallRating != null ? Number(body.overallRating) : null,
      recommendation: body.recommendation != null ? String(body.recommendation) : null,
      feedback: body.feedback != null ? String(body.feedback) : null,
      privateNotes: body.privateNotes != null ? String(body.privateNotes) : null,
      submit: Boolean(body.submit),
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({
      evaluation: result.evaluation,
      applicationStatusUnchanged: true,
      autoHires: false,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
