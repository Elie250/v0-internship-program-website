import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { JOB_WRITE_ROLES, roleAllows } from '@/lib/recruitment/rbac'
import {
  assignHiringManagerToJob,
  listJobAssignments,
  unassignHiringManagerFromJob,
} from '@/lib/recruitment/job-assignments'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; jobId: string }> }
) {
  try {
    const { id: organizationId, jobId } = await context.params
    const access = await requireOrganizationAccess(organizationId, JOB_WRITE_ROLES)
    if (!roleAllows(access.asPlatformAdmin, access.membership?.role, JOB_WRITE_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { assignments, error } = await listJobAssignments(organizationId, jobId)
    if (error) {
      const status = error === 'Job not found' ? 404 : 500
      return NextResponse.json({ error }, { status })
    }
    return NextResponse.json({ assignments })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; jobId: string }> }
) {
  try {
    const { id: organizationId, jobId } = await context.params
    const access = await requireOrganizationAccess(organizationId, JOB_WRITE_ROLES)
    if (!roleAllows(access.asPlatformAdmin, access.membership?.role, JOB_WRITE_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await request.json()
    const result = await assignHiringManagerToJob({
      organizationId,
      jobId,
      userId: String(body.userId ?? ''),
      actorUserId: access.user.id,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ assignment: result.assignment }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; jobId: string }> }
) {
  try {
    const { id: organizationId, jobId } = await context.params
    const access = await requireOrganizationAccess(organizationId, JOB_WRITE_ROLES)
    if (!roleAllows(access.asPlatformAdmin, access.membership?.role, JOB_WRITE_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || ''
    const result = await unassignHiringManagerFromJob({
      organizationId,
      jobId,
      userId,
      actorUserId: access.user.id,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
