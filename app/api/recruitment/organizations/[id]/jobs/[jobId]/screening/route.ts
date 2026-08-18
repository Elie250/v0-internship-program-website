import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { JOB_READ_ROLES, SCREENING_WRITE_ROLES, roleAllows } from '@/lib/recruitment/rbac'
import {
  deleteJobScreeningConfig,
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
    const publish = Boolean(body.publish) || body.status === 'published'
    const unpublish = body.status === 'draft' && !publish

    let attachedCount: number | null = null
    let items: unknown[] | undefined
    const questionSelection = body.questionSelection != null ? String(body.questionSelection) : undefined

    // Auto-from-bank must not keep a stale pinned list from a previous manual publish
    const questionIds =
      questionSelection === 'random_from_bank'
        ? []
        : Array.isArray(body.questionIds)
          ? body.questionIds.map(String)
          : null

    // Attach questions first so publish validation sees the latest selection
    if (questionIds) {
      const itemsResult = await setJobScreeningItems({
        jobId,
        organizationId,
        actorUserId: access.user.id,
        questionIds,
      })
      if (itemsResult.error) {
        return NextResponse.json({ error: itemsResult.error }, { status: 400 })
      }
      items = itemsResult.items
      attachedCount = questionIds.length
    }

    const configResult = await upsertJobScreeningConfig({
      jobId,
      organizationId,
      actorUserId: access.user.id,
      enabled: unpublish ? false : Boolean(body.enabled) || publish,
      durationMinutes: body.durationMinutes != null ? Number(body.durationMinutes) : null,
      questionCount: body.questionCount != null ? Number(body.questionCount) : null,
      categories: Array.isArray(body.categories) ? body.categories.map(String) : [],
      difficultyDistribution:
        body.difficultyDistribution && typeof body.difficultyDistribution === 'object'
          ? body.difficultyDistribution
          : {},
      questionTypeMix:
        body.questionTypeMix && typeof body.questionTypeMix === 'object'
          ? body.questionTypeMix
          : undefined,
      passingScore: body.passingScore != null ? Number(body.passingScore) : null,
      passingCriteria: body.passingCriteria != null ? String(body.passingCriteria) : null,
      candidateInstructions:
        body.candidateInstructions !== undefined
          ? body.candidateInstructions != null
            ? String(body.candidateInstructions)
            : null
          : undefined,
      attemptPolicy: body.attemptPolicy != null ? String(body.attemptPolicy) : undefined,
      questionSelection,
      randomized: body.randomized !== false,
      dynamicParameters: Boolean(body.dynamicParameters),
      perQuestionTimeSeconds:
        body.perQuestionTimeSeconds != null ? Number(body.perQuestionTimeSeconds) : null,
      integrityMonitoring: Boolean(body.integrityMonitoring),
      status: publish ? 'published' : unpublish ? 'draft' : undefined,
      sectionMinimums:
        body.sectionMinimums && typeof body.sectionMinimums === 'object'
          ? Object.fromEntries(
              Object.entries(body.sectionMinimums).map(([k, v]) => [k, Number(v)])
            )
          : undefined,
      maxAttempts: body.maxAttempts != null ? Number(body.maxAttempts) : null,
      publish,
      attachedQuestionCount: attachedCount,
      bankQuestionCount:
        body.bankQuestionCount != null ? Number(body.bankQuestionCount) : undefined,
    })
    if (configResult.error) {
      return NextResponse.json({ error: configResult.error }, { status: 400 })
    }

    if (!items) {
      const listed = await listJobScreeningItems(jobId, organizationId)
      items = listed.items
    }

    return NextResponse.json({ config: configResult.config, items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; jobId: string }> }
) {
  try {
    const { id: organizationId, jobId } = await context.params
    const access = await requireOrganizationAccess(organizationId, SCREENING_WRITE_ROLES)
    if (!roleAllows(access.asPlatformAdmin, access.membership?.role, SCREENING_WRITE_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await assertCanAccessJob({ access, organizationId, jobId })
    const result = await deleteJobScreeningConfig({
      jobId,
      organizationId,
      actorUserId: access.user.id,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({
      success: true,
      message: 'Technical assessment removed. Past candidate attempts are kept for the hiring file.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
