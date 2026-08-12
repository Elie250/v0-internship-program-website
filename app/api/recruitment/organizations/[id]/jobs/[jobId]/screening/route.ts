import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { JOB_READ_ROLES, SCREENING_WRITE_ROLES, roleAllows } from '@/lib/recruitment/rbac'
import {
  getJobScreeningConfig,
  listJobScreeningItems,
  setJobScreeningItems,
  upsertJobScreeningConfig,
} from '@/lib/recruitment/screening'
import { assertCanAccessJob } from '@/lib/recruitment/job-assignments'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; jobId: string }> }
) {
  try {
    const { id: organizationId, jobId } = await context.params
    const access = await requireOrganizationAccess(organizationId, JOB_READ_ROLES)
    await assertCanAccessJob({ access, organizationId, jobId })
    const [{ config, error }, { items }] = await Promise.all([
      getJobScreeningConfig(jobId, organizationId),
      listJobScreeningItems(jobId, organizationId),
    ])
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ config, items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; jobId: string }> }
) {
  try {
    const { id: organizationId, jobId } = await context.params
    const access = await requireOrganizationAccess(organizationId, SCREENING_WRITE_ROLES)
    if (!roleAllows(access.asPlatformAdmin, access.membership?.role, SCREENING_WRITE_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await request.json()
    const configResult = await upsertJobScreeningConfig({
      jobId,
      organizationId,
      actorUserId: access.user.id,
      enabled: Boolean(body.enabled),
      durationMinutes: body.durationMinutes != null ? Number(body.durationMinutes) : null,
      questionCount: body.questionCount != null ? Number(body.questionCount) : null,
      categories: Array.isArray(body.categories) ? body.categories.map(String) : [],
      difficultyDistribution:
        body.difficultyDistribution && typeof body.difficultyDistribution === 'object'
          ? body.difficultyDistribution
          : {},
      passingScore: body.passingScore != null ? Number(body.passingScore) : null,
      passingCriteria: body.passingCriteria != null ? String(body.passingCriteria) : null,
      attemptPolicy: body.attemptPolicy != null ? String(body.attemptPolicy) : undefined,
      questionSelection: body.questionSelection != null ? String(body.questionSelection) : undefined,
      randomized: body.randomized !== false,
      dynamicParameters: Boolean(body.dynamicParameters),
      perQuestionTimeSeconds:
        body.perQuestionTimeSeconds != null ? Number(body.perQuestionTimeSeconds) : null,
      integrityMonitoring: Boolean(body.integrityMonitoring),
      status: body.status === 'published' || body.status === 'draft' ? body.status : undefined,
      sectionMinimums:
        body.sectionMinimums && typeof body.sectionMinimums === 'object'
          ? Object.fromEntries(
              Object.entries(body.sectionMinimums).map(([k, v]) => [k, Number(v)])
            )
          : undefined,
      maxAttempts: body.maxAttempts != null ? Number(body.maxAttempts) : null,
      publish: Boolean(body.publish),
    })
    if (configResult.error) {
      return NextResponse.json({ error: configResult.error }, { status: 400 })
    }

    if (Array.isArray(body.questionIds)) {
      const itemsResult = await setJobScreeningItems({
        jobId,
        organizationId,
        actorUserId: access.user.id,
        questionIds: body.questionIds.map(String),
      })
      if (itemsResult.error) {
        return NextResponse.json({ error: itemsResult.error }, { status: 400 })
      }
      return NextResponse.json({ config: configResult.config, items: itemsResult.items })
    }

    const { items } = await listJobScreeningItems(jobId, organizationId)
    return NextResponse.json({ config: configResult.config, items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
