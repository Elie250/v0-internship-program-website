import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { JOB_READ_ROLES } from '@/lib/recruitment/rbac'
import { getJobScreeningConfig, listJobScreeningItems } from '@/lib/recruitment/screening'
import { assertCanAccessJob } from '@/lib/recruitment/job-assignments'

/** Employer preview of configured screening (no answer keys for platform questions). */
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
    return NextResponse.json({
      preview: {
        enabled: config?.enabled ?? false,
        status: config?.status ?? 'draft',
        durationMinutes: config?.duration_minutes ?? null,
        questionCount: config?.question_count ?? null,
        passingScore: config?.passing_score ?? null,
        sectionMinimums: config?.section_minimums ?? {},
        attemptPolicy: config?.attempt_policy ?? 'single',
        randomized: config?.randomized !== false,
        dynamicParameters: Boolean(config?.dynamic_parameters),
        items: (items ?? []).map((item: Record<string, unknown>) => {
          const question = Array.isArray(item.question) ? item.question[0] : item.question
          const q = (question ?? {}) as Record<string, unknown>
          return {
            sortOrder: item.sort_order,
            prompt: q.prompt,
            discipline: q.discipline,
            difficulty: q.difficulty,
            ownerType: q.owner_type,
            expectedTimeSeconds: q.expected_time_seconds,
          }
        }),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
