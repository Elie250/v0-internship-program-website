import { NextResponse } from 'next/server'
import { requireRecruitmentPlatformAdmin } from '@/lib/recruitment/authz'
import { createOrganization, listOrganizations } from '@/lib/recruitment/organizations'
import { isRecruitmentOrgStatus } from '@/lib/recruitment/types'

export async function GET(request: Request) {
  try {
    await requireRecruitmentPlatformAdmin()
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status') ?? 'all'
    const status =
      statusParam === 'all' || isRecruitmentOrgStatus(statusParam) ? statusParam : 'all'
    const search = searchParams.get('search') ?? undefined

    const { organizations, error } = await listOrganizations({
      status: status as 'all' | 'draft' | 'active' | 'suspended',
      search,
    })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ organizations })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRecruitmentPlatformAdmin()
    const body = await request.json()
    const result = await createOrganization({
      name: String(body.name ?? ''),
      slug: body.slug ? String(body.slug) : undefined,
      description: body.description != null ? String(body.description) : undefined,
      careersBlurb: body.careersBlurb != null ? String(body.careersBlurb) : undefined,
      notificationEmail:
        body.notificationEmail != null ? String(body.notificationEmail) : undefined,
      status: body.status,
      actorUserId: admin.id,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })

    let membership = null
    let membershipWarning: string | null = null
    const adminEmail = String(body.adminEmail ?? body.initialAdminEmail ?? '').trim()
    if (adminEmail && result.organization) {
      const { normalizeRecruitmentEmail } = await import('@/lib/recruitment/email-normalize')
      const { findUserByNormalizedEmail } = await import('@/lib/recruitment/user-lookup')
      const { upsertOrganizationMember } = await import('@/lib/recruitment/memberships')
      const { isRecruitmentOrgRole } = await import('@/lib/recruitment/types')

      const normalizedEmail = normalizeRecruitmentEmail(adminEmail)
      const role = String(body.adminRole ?? 'organization_admin')
      if (normalizedEmail && isRecruitmentOrgRole(role)) {
        const { user, error: lookupError } = await findUserByNormalizedEmail(normalizedEmail)
        if (lookupError) {
          membershipWarning = 'Organization created, but user lookup failed for the admin email.'
        } else if (!user) {
          membershipWarning =
            'Organization created. No platform user with that email yet — ask them to sign in on Talent once, then add them under Members.'
        } else {
          const memberResult = await upsertOrganizationMember({
            organizationId: result.organization.id,
            userId: user.id,
            role,
            status: 'active',
            actorUserId: admin.id,
          })
          if (memberResult.error) {
            membershipWarning = `Organization created, but could not grant hiring access: ${memberResult.error}`
          } else {
            membership = memberResult.membership
          }
        }
      }
    }

    return NextResponse.json({
      organization: result.organization,
      membership,
      membershipWarning,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
