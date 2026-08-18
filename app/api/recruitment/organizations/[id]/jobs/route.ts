import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { JOB_READ_ROLES, JOB_WRITE_ROLES, roleAllows } from '@/lib/recruitment/rbac'
import {
  createOrganizationJob,
  listOrganizationJobs,
  updateOrganizationJob,
} from '@/lib/recruitment/jobs'
import { resolveScopedJobIds } from '@/lib/recruitment/job-assignments'
import { serializeApplicationDeadlineInput } from '@/lib/recruitment/job-deadline'

function optionalNullableString(
  body: Record<string, unknown>,
  key: string
): string | null | undefined {
  if (!(key in body)) return undefined
  const value = body[key]
  if (value == null || String(value).trim() === '') return null
  return String(value)
}

function jobFieldsFromBody(body: Record<string, unknown>) {
  return {
    title: body.title != null ? String(body.title) : undefined,
    slug: body.slug != null ? String(body.slug) : undefined,
    description: body.description != null ? String(body.description) : undefined,
    responsibilities: body.responsibilities != null ? String(body.responsibilities) : undefined,
    requirements: body.requirements != null ? String(body.requirements) : undefined,
    qualifications: body.qualifications != null ? String(body.qualifications) : undefined,
    location: body.location != null ? String(body.location) : undefined,
    employmentType: body.employmentType != null ? String(body.employmentType) : undefined,
    workMode: body.workMode != null ? String(body.workMode) : undefined,
    category: body.category != null ? String(body.category) : undefined,
    department: body.department != null ? String(body.department) : undefined,
    skills: body.skills,
    salaryMin: body.salaryMin != null ? Number(body.salaryMin) : undefined,
    salaryMax: body.salaryMax != null ? Number(body.salaryMax) : undefined,
    salaryCurrency: body.salaryCurrency != null ? String(body.salaryCurrency) : undefined,
    salaryVisible: body.salaryVisible != null ? Boolean(body.salaryVisible) : undefined,
    visibility: body.visibility != null ? String(body.visibility) : undefined,
    status: body.status as never,
    // null must be preserved so clearing the deadline writes NULL instead of skipping the column
    applicationDeadline: (() => {
      const raw = optionalNullableString(body, 'applicationDeadline')
      if (raw === undefined) return undefined
      if (raw === null) return null
      return serializeApplicationDeadlineInput(raw)
    })(),
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, JOB_READ_ROLES)
    const scoped = await resolveScopedJobIds({ access, organizationId })
    if (scoped.error) return NextResponse.json({ error: scoped.error }, { status: 403 })
    const { jobs, error } = await listOrganizationJobs(organizationId, {
      jobIds: scoped.jobIds,
    })
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
    const access = await requireOrganizationAccess(organizationId, JOB_WRITE_ROLES)
    if (!roleAllows(access.asPlatformAdmin, access.membership?.role, JOB_WRITE_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json()) as Record<string, unknown>
    const fields = jobFieldsFromBody(body)
    const result = await createOrganizationJob({
      organizationId,
      title: fields.title ?? '',
      slug: fields.slug,
      description: fields.description,
      responsibilities: fields.responsibilities,
      requirements: fields.requirements,
      qualifications: fields.qualifications,
      location: fields.location,
      employmentType: fields.employmentType,
      workMode: fields.workMode,
      category: fields.category,
      department: fields.department,
      skills: fields.skills,
      salaryMin: fields.salaryMin,
      salaryMax: fields.salaryMax,
      salaryCurrency: fields.salaryCurrency,
      salaryVisible: fields.salaryVisible,
      visibility: fields.visibility,
      status: fields.status,
      applicationDeadline: fields.applicationDeadline ?? null,
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
    const access = await requireOrganizationAccess(organizationId, JOB_WRITE_ROLES)
    if (!roleAllows(access.asPlatformAdmin, access.membership?.role, JOB_WRITE_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json()) as Record<string, unknown>
    const jobId = String(body.jobId ?? '')
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

    const fields = jobFieldsFromBody(body)
    const result = await updateOrganizationJob({
      jobId,
      organizationId,
      ...fields,
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
