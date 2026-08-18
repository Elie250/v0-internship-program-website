import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { APPLICATION_REVIEW_ROLES } from '@/lib/recruitment/rbac'
import {
  listApplicationMessages,
  sendApplicationCandidateMessage,
} from '@/lib/recruitment/application-messages'
import { assertCanAccessApplication } from '@/lib/recruitment/job-assignments'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const { id: organizationId, applicationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, APPLICATION_REVIEW_ROLES)
    await assertCanAccessApplication({ access, organizationId, applicationId })
    const { messages, error } = await listApplicationMessages(applicationId, organizationId)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ messages })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const { id: organizationId, applicationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, APPLICATION_REVIEW_ROLES)
    await assertCanAccessApplication({ access, organizationId, applicationId })
    const body = await request.json()
    const result = await sendApplicationCandidateMessage({
      applicationId,
      organizationId,
      authorUserId: access.user.id,
      authorEmail: access.user.email,
      messageType: body.messageType,
      subject: body.subject,
      body: String(body.body ?? ''),
      resourceLinks: body.resourceLinks,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ message: result.message })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
