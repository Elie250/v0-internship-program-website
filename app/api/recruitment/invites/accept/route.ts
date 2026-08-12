import { NextResponse } from 'next/server'
import { getRecruitmentSessionUser } from '@/lib/recruitment/authz'
import {
  acceptOrganizationInvite,
  getInviteByRawToken,
} from '@/lib/recruitment/organization-invites'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = String(searchParams.get('token') ?? '')
    const lookedUp = await getInviteByRawToken(token)
    if (lookedUp.error || !lookedUp.invite) {
      return NextResponse.json({ error: lookedUp.error ?? 'Invitation not found' }, { status: 404 })
    }
    const invite = lookedUp.invite
    return NextResponse.json({
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expires_at,
        organizationName: lookedUp.organizationName ?? null,
        organizationStatus: lookedUp.organizationStatus ?? null,
        organizationId: invite.organization_id,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Could not load invitation' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const token = String(body.token ?? '')
    // Ignore body.organization_id / body.role — invite row is authoritative.
    const result = await acceptOrganizationInvite({
      rawToken: token,
      userId: user.id,
      userEmail: user.email,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({
      success: true,
      organizationId: result.organizationId,
      membershipId: result.membershipId,
      redirectTo: '/employer',
    })
  } catch {
    return NextResponse.json({ error: 'Could not accept invitation' }, { status: 500 })
  }
}
