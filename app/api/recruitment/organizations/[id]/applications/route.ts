import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { APPLICATION_REVIEW_ROLES } from '@/lib/recruitment/rbac'
import { listOrganizationApplications } from '@/lib/recruitment/employer-applications'
import { resolveScopedJobIds } from '@/lib/recruitment/job-assignments'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, APPLICATION_REVIEW_ROLES)
    const { searchParams } = new URL(request.url)
    const requestedJobId = searchParams.get('jobId')
    const scoped = await resolveScopedJobIds({
      access,
      organizationId,
      requestedJobId,
    })
    if (scoped.error) return NextResponse.json({ error: scoped.error }, { status: 403 })

    const { applications, error } = await listOrganizationApplications({
      organizationId,
      jobIds: scoped.jobIds,
      status: searchParams.get('status') ?? undefined,
    })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ applications })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
