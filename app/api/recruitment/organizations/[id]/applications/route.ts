import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { APPLICATION_REVIEW_ROLES } from '@/lib/recruitment/rbac'
import { listOrganizationApplications } from '@/lib/recruitment/employer-applications'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await context.params
    await requireOrganizationAccess(organizationId, APPLICATION_REVIEW_ROLES)
    const { searchParams } = new URL(request.url)
    const { applications, error } = await listOrganizationApplications({
      organizationId,
      jobId: searchParams.get('jobId') ?? undefined,
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
