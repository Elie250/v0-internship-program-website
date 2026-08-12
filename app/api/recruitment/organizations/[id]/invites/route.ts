import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import {
  createOrganizationInvite,
  listOrganizationInvites,
} from '@/lib/recruitment/organization-invites'
import { isRecruitmentOrgRole } from '@/lib/recruitment/types'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    await requireOrganizationAccess(id, ['organization_admin'])
    const { invites, error } = await listOrganizationInvites(id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    // Never return token hashes to the client.
    return NextResponse.json({
      invites: invites.map(({ token_hash: _t, ...rest }) => rest),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, ['organization_admin'])
    if (!access.asPlatformAdmin && access.membership?.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    // Ignore any client-supplied organization_id — path param is authoritative after authz.
    const email = String(body.email ?? '')
    const role = String(body.role ?? 'hr_recruiter')
    if (!isRecruitmentOrgRole(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const result = await createOrganizationInvite({
      organizationId,
      email,
      role,
      invitedByUserId: access.user.id,
    })
    if (result.error || !result.invite) {
      return NextResponse.json({ error: result.error ?? 'Invite failed' }, { status: 400 })
    }

    const { token_hash: _t, ...safeInvite } = result.invite
    return NextResponse.json({ invite: safeInvite })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
