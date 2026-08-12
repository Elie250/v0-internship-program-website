import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import {
  createOrganizationJob,
  listOrganizationJobs,
  updateOrganizationJob,
} from '@/lib/recruitment/jobs'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await context.params
    await requireOrganizationAccess(organizationId, [
      'organization_admin',
      'hr_recruiter',
      'hiring_manager',
    ])
    const { jobs, error } = await listOrganizationJobs(organizationId)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ jobs })
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
    const result = await createOrganizationJob({
      organizationId,
      title: String(body.title ?? ''),
      slug: body.slug ? String(body.slug) : undefined,
      description: body.description != null ? String(body.description) : undefined,
      responsibilities: body.responsibilities != null ? String(body.responsibilities) : undefined,
      requirements: body.requirements != null ? String(body.requirements) : undefined,
      qualifications: body.qualifications != null ? String(body.qualifications) : undefined,
      location: body.location != null ? String(body.location) : undefined,
      employmentType: body.employmentType != null ? String(body.employmentType) : undefined,
      workMode: body.workMode != null ? String(body.workMode) : undefined,
      category: body.category != null ? String(body.category) : undefined,
      status: body.status,
      applicationDeadline: body.applicationDeadline ?? null,
      actorUserId: access.user.id,
    })

    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ job: result.job })
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
    const { id: organizationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, ['organization_admin'])
    if (!access.asPlatformAdmin && access.membership?.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const jobId = String(body.jobId ?? '')
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

    const result = await updateOrganizationJob({
      jobId,
      organizationId,
      title: body.title != null ? String(body.title) : undefined,
      slug: body.slug != null ? String(body.slug) : undefined,
      description: body.description,
      responsibilities: body.responsibilities,
      requirements: body.requirements,
      qualifications: body.qualifications,
      location: body.location,
      employmentType: body.employmentType,
      workMode: body.workMode,
      category: body.category,
      status: body.status,
      applicationDeadline: body.applicationDeadline,
      actorUserId: access.user.id,
    })

    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ job: result.job })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
