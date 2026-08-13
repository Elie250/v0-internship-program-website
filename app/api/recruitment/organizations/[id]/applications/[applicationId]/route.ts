import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { APPLICATION_REVIEW_ROLES } from '@/lib/recruitment/rbac'
import {
  getOrganizationApplication,
  listApplicationStatusHistory,
  updateOrganizationApplicationStatus,
} from '@/lib/recruitment/employer-applications'
import { listApplicationNotes } from '@/lib/recruitment/application-notes'
import { assertCanAccessApplication } from '@/lib/recruitment/job-assignments'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const { id: organizationId, applicationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, APPLICATION_REVIEW_ROLES)
    await assertCanAccessApplication({ access, organizationId, applicationId })
    const [{ application, error }, { history }, { notes }] = await Promise.all([
      getOrganizationApplication(applicationId, organizationId),
      listApplicationStatusHistory(applicationId, organizationId),
      listApplicationNotes(applicationId, organizationId),
    ])
    if (error) return NextResponse.json({ error }, { status: 500 })
    if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ application, history, notes })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const { id: organizationId, applicationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, APPLICATION_REVIEW_ROLES)
    await assertCanAccessApplication({ access, organizationId, applicationId })
    const body = await request.json()
    const result = await updateOrganizationApplicationStatus({
      applicationId,
      organizationId,
      status: String(body.status ?? ''),
      actorUserId: access.user.id,
      asPlatformAdmin: access.asPlatformAdmin,
      membershipRole: access.membership?.role ?? null,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ application: result.application, warning: result.warning ?? null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
