import { NextResponse } from 'next/server'
import { requireRecruitmentPlatformAdmin } from '@/lib/recruitment/authz'
import {
  approveOrganizationRequest,
  isOrgRequestStatus,
  listOrganizationRequests,
  rejectOrganizationRequest,
} from '@/lib/recruitment/organization-requests'

export async function GET(request: Request) {
  try {
    await requireRecruitmentPlatformAdmin()
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status') ?? 'pending'
    const status =
      statusParam === 'all' || isOrgRequestStatus(statusParam) ? statusParam : 'pending'
    const { requests, error } = await listOrganizationRequests({
      status: status as 'all' | 'pending' | 'approved' | 'rejected' | 'withdrawn',
    })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ requests })
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
    const requestId = String(body.requestId ?? '')
    const action = String(body.action ?? '')
    const reviewNotes = body.reviewNotes != null ? String(body.reviewNotes) : null
    const organizationName =
      body.organizationName != null ? String(body.organizationName) : null
    const adminUserId = body.adminUserId != null ? String(body.adminUserId) : null

    if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 })

    if (action === 'approve') {
      const result = await approveOrganizationRequest({
        requestId,
        actorUserId: admin.id,
        reviewNotes,
        organizationName,
        adminUserId,
      })
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json({
        request: result.request,
        organizationId: result.organizationId,
      })
    }

    if (action === 'reject') {
      const result = await rejectOrganizationRequest({
        requestId,
        actorUserId: admin.id,
        reviewNotes,
      })
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json({ request: result.request })
    }

    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
