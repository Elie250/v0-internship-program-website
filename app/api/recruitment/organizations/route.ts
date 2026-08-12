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
    return NextResponse.json({ organization: result.organization })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
