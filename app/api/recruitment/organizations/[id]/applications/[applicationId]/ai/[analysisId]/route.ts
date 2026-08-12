import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { APPLICATION_REVIEW_ROLES } from '@/lib/recruitment/rbac'
import {
  candidateMayAccessHrAiAnalysis,
  getApplicationAiAnalysis,
} from '@/lib/recruitment/ai-analysis'
import { assertCanAccessApplication } from '@/lib/recruitment/job-assignments'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; applicationId: string; analysisId: string }> }
) {
  try {
    if (candidateMayAccessHrAiAnalysis()) {
      return NextResponse.json({ error: 'Misconfigured' }, { status: 500 })
    }
    const { id: organizationId, applicationId, analysisId } = await context.params
    const access = await requireOrganizationAccess(organizationId, APPLICATION_REVIEW_ROLES)
    await assertCanAccessApplication({ access, organizationId, applicationId })
    const result = await getApplicationAiAnalysis(organizationId, applicationId, analysisId)
    if (result.error) {
      const status = result.error === 'Forbidden' ? 403 : 404
      return NextResponse.json({ error: result.error }, { status })
    }
    return NextResponse.json({ analysis: result.analysis, provider: result.provider })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
