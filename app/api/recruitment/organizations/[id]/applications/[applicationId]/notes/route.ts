import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { APPLICATION_REVIEW_ROLES } from '@/lib/recruitment/rbac'
import { addApplicationNote, listApplicationNotes } from '@/lib/recruitment/application-notes'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const { id: organizationId, applicationId } = await context.params
    await requireOrganizationAccess(organizationId, APPLICATION_REVIEW_ROLES)
    const { notes, error } = await listApplicationNotes(applicationId, organizationId)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ notes })
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
    const body = await request.json()
    const result = await addApplicationNote({
      applicationId,
      organizationId,
      authorUserId: access.user.id,
      body: String(body.body ?? ''),
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ note: result.note })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
