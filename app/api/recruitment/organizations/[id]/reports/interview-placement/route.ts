import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { APPLICATION_REVIEW_ROLES } from '@/lib/recruitment/rbac'
import { resolveScopedJobIds } from '@/lib/recruitment/job-assignments'
import { getInterviewPlacementReport } from '@/lib/recruitment/interview-placement-report'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, APPLICATION_REVIEW_ROLES)
    const scoped = await resolveScopedJobIds({ access, organizationId })
    if (scoped.error) return NextResponse.json({ error: scoped.error }, { status: 403 })

    const { report, error } = await getInterviewPlacementReport({
      organizationId,
      jobIds: scoped.jobIds,
    })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ report })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
