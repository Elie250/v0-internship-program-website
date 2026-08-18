import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { JOB_READ_ROLES } from '@/lib/recruitment/rbac'
import { previewJobScreening } from '@/lib/recruitment/screening'
import { assertCanAccessJob } from '@/lib/recruitment/job-assignments'

/** Employer preview of configured screening (no answer keys). */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; jobId: string }> }
) {
  try {
    const { id: organizationId, jobId } = await context.params
    const access = await requireOrganizationAccess(organizationId, JOB_READ_ROLES)
    await assertCanAccessJob({ access, organizationId, jobId })
    const result = await previewJobScreening(jobId, organizationId)
    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
