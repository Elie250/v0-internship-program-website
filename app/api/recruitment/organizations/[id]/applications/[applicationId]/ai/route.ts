import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { APPLICATION_REVIEW_ROLES, SCREENING_WRITE_ROLES, roleAllows } from '@/lib/recruitment/rbac'
import {
  candidateMayAccessHrAiAnalysis,
  listApplicationAiAnalyses,
  requestApplicationAdvisoryAnalysis,
} from '@/lib/recruitment/ai-analysis'
import { assertCanAccessApplication } from '@/lib/recruitment/job-assignments'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    if (candidateMayAccessHrAiAnalysis()) {
      return NextResponse.json({ error: 'Misconfigured' }, { status: 500 })
    }
    const { id: organizationId, applicationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, APPLICATION_REVIEW_ROLES)
    await assertCanAccessApplication({ access, organizationId, applicationId })
    const result = await listApplicationAiAnalyses(organizationId, applicationId)
    if (result.error) {
      const status = result.error === 'Forbidden' ? 403 : 404
      return NextResponse.json({ error: result.error }, { status })
    }
    return NextResponse.json({
      analyses: result.analyses,
      provider: result.provider,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const { id: organizationId, applicationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, SCREENING_WRITE_ROLES)
    if (!roleAllows(access.asPlatformAdmin, access.membership?.role, SCREENING_WRITE_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await assertCanAccessApplication({ access, organizationId, applicationId })

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    delete body.technical_score
    delete body.technicalScore
    delete body.integrity_band
    delete body.integrityBand

    const result = await requestApplicationAdvisoryAnalysis({
      organizationId,
      applicationId,
      requestedBy: access.user.id,
      analysisType:
        body.analysisType === 'application_advisory' ? 'application_advisory' : 'application_advisory',
    })

    if (result.error && !result.analysis) {
      const status = result.error === 'Forbidden' ? 403 : 400
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({
      analysis: result.analysis,
      provider: result.provider,
      disclaimer: 'AI-generated analysis is advisory and does not determine hiring decisions.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
