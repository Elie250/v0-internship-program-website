import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { JOB_READ_ROLES } from '@/lib/recruitment/rbac'
import { getOrganizationJob } from '@/lib/recruitment/jobs'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; jobId: string }> }
) {
  try {
    const { id: organizationId, jobId } = await context.params
    await requireOrganizationAccess(organizationId, JOB_READ_ROLES)
    const { job, error } = await getOrganizationJob(jobId, organizationId)
    if (error) return NextResponse.json({ error }, { status: 500 })
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ job })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
