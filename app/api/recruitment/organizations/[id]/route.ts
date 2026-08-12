import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { getOrganizationById, updateOrganization } from '@/lib/recruitment/organizations'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    await requireOrganizationAccess(id)
    const { organization, error } = await getOrganizationById(id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    if (!organization) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ organization })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const access = await requireOrganizationAccess(id, ['organization_admin'])
    // Platform admin OR org admin only (requireOrganizationAccess with org_admin;
    // platform admin bypasses role check)
    if (!access.asPlatformAdmin && access.membership?.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    // Lifecycle status (draft/active/suspended) is platform-admin only (W7)
    const status =
      access.asPlatformAdmin && body.status !== undefined ? body.status : undefined

    const result = await updateOrganization({
      id,
      name: body.name != null ? String(body.name) : undefined,
      description: body.description !== undefined ? body.description : undefined,
      careersBlurb: body.careersBlurb !== undefined ? body.careersBlurb : undefined,
      logoUrl: body.logoUrl !== undefined ? body.logoUrl : undefined,
      notificationEmail:
        body.notificationEmail !== undefined ? body.notificationEmail : undefined,
      status,
      actorUserId: access.user.id,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ organization: result.organization })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
