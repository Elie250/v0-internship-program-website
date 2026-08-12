import { NextResponse } from 'next/server'
import { resolveEmployerOrganization } from '@/lib/recruitment/employer-context'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { getEmployerDashboardMetrics } from '@/lib/recruitment/employer-applications'
import { listOrganizationJobs } from '@/lib/recruitment/jobs'
import { listOrganizationApplications } from '@/lib/recruitment/employer-applications'
import { resolveScopedJobIds } from '@/lib/recruitment/job-assignments'
import { APPLICATION_REVIEW_ROLES } from '@/lib/recruitment/rbac'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedOrg = searchParams.get('organizationId')
    const ctx = await resolveEmployerOrganization(requestedOrg)
    const access = await requireOrganizationAccess(ctx.organization.id, APPLICATION_REVIEW_ROLES)
    const scoped = await resolveScopedJobIds({
      access,
      organizationId: ctx.organization.id,
    })
    if (scoped.error) return NextResponse.json({ error: scoped.error }, { status: 403 })

    const [metrics, { jobs }, { applications }] = await Promise.all([
      getEmployerDashboardMetrics(ctx.organization.id, { jobIds: scoped.jobIds }),
      listOrganizationJobs(ctx.organization.id, { jobIds: scoped.jobIds }),
      listOrganizationApplications({
        organizationId: ctx.organization.id,
        jobIds: scoped.jobIds,
      }),
    ])
    return NextResponse.json({
      ...ctx,
      metrics,
      recentJobs: (jobs ?? []).slice(0, 5),
      recentApplications: (applications ?? []).slice(0, 8),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
