import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { APPLICATION_REVIEW_ROLES } from '@/lib/recruitment/rbac'
import { getEmployerSessionReview } from '@/lib/recruitment/screening-sessions'
import { assertCanAccessScreeningSession } from '@/lib/recruitment/job-assignments'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id: organizationId, sessionId } = await context.params
    const access = await requireOrganizationAccess(organizationId, APPLICATION_REVIEW_ROLES)
    await assertCanAccessScreeningSession({ access, organizationId, sessionId })
    const result = await getEmployerSessionReview(organizationId, sessionId)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
