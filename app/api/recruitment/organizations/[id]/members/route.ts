import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import {
  listOrganizationMembers,
  removeOrganizationMember,
  upsertOrganizationMember,
} from '@/lib/recruitment/memberships'
import { isRecruitmentOrgRole } from '@/lib/recruitment/types'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    await requireOrganizationAccess(id, [
      'organization_admin',
      'hr_recruiter',
      'hiring_manager',
    ])
    const { members, error } = await listOrganizationMembers(id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ members })
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
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase()
    const role = String(body.role ?? 'hr_recruiter')
    if (!email || !isRecruitmentOrgRole(role)) {
      return NextResponse.json({ error: 'Valid email and role are required' }, { status: 400 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .ilike('email', email)
      .maybeSingle()

    if (!user) {
      return NextResponse.json(
        {
          error:
            'No platform user with that email yet. Ask them to Continue with Email on Talent first, then add them.',
        },
        { status: 400 }
      )
    }

    const result = await upsertOrganizationMember({
      organizationId,
      userId: user.id,
      role,
      status: 'active',
      actorUserId: access.user.id,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ membership: result.membership })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, ['organization_admin'])
    if (!access.asPlatformAdmin && access.membership?.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const membershipId = searchParams.get('membershipId')
    if (!membershipId) {
      return NextResponse.json({ error: 'membershipId required' }, { status: 400 })
    }

    const result = await removeOrganizationMember({
      organizationId,
      membershipId,
      actorUserId: access.user.id,
    })
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Remove failed' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
