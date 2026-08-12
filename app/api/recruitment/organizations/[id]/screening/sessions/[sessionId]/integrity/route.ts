import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { APPLICATION_REVIEW_ROLES } from '@/lib/recruitment/rbac'
import { getEmployerIntegrityReport } from '@/lib/recruitment/screening-integrity'
import { candidateMayReadIntegrityBand } from '@/lib/recruitment/screening-integrity-validate'
import { assertCanAccessScreeningSession } from '@/lib/recruitment/job-assignments'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    if (candidateMayReadIntegrityBand()) {
      return NextResponse.json({ error: 'Misconfigured' }, { status: 500 })
    }

    const { id: organizationId, sessionId } = await context.params
    const access = await requireOrganizationAccess(organizationId, APPLICATION_REVIEW_ROLES)
    await assertCanAccessScreeningSession({ access, organizationId, sessionId })
    const result = await getEmployerIntegrityReport(organizationId, sessionId)
    if (result.error) {
      const status = result.error === 'Forbidden' ? 403 : 404
      return NextResponse.json({ error: result.error }, { status })
    }
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
