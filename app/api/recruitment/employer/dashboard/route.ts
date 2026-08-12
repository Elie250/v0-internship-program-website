import { NextResponse } from 'next/server'
import { resolveEmployerOrganization } from '@/lib/recruitment/employer-context'
import { getEmployerDashboardMetrics } from '@/lib/recruitment/employer-applications'
import { listOrganizationJobs } from '@/lib/recruitment/jobs'
import { listOrganizationApplications } from '@/lib/recruitment/employer-applications'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedOrg = searchParams.get('organizationId')
    const ctx = await resolveEmployerOrganization(requestedOrg)
    const [metrics, { jobs }, { applications }] = await Promise.all([
      getEmployerDashboardMetrics(ctx.organization.id),
      listOrganizationJobs(ctx.organization.id),
      listOrganizationApplications({ organizationId: ctx.organization.id }),
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
