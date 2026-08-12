import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { APPLICATION_REVIEW_ROLES } from '@/lib/recruitment/rbac'
import { compareJobCandidates } from '@/lib/recruitment/candidate-compare'
import { assertCanAccessJob } from '@/lib/recruitment/job-assignments'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; jobId: string }> }
) {
  try {
    const { id: organizationId, jobId } = await context.params
    const access = await requireOrganizationAccess(organizationId, APPLICATION_REVIEW_ROLES)
    await assertCanAccessJob({ access, organizationId, jobId })
    const result = await compareJobCandidates(organizationId, jobId)
    if (result.error) {
      const status = result.error === 'Job not found' ? 404 : 500
      return NextResponse.json({ error: result.error }, { status })
    }
    return NextResponse.json({
      job: result.job,
      candidates: result.candidates,
      autoRanked: false,
      note: 'Objective comparison only — HR decides. AI does not rank candidates.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
