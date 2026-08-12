import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { SCREENING_WRITE_ROLES, roleAllows } from '@/lib/recruitment/rbac'
import { recordIntegrityReview } from '@/lib/recruitment/screening-integrity'
import { integrityApiMayModifyTechnicalScore } from '@/lib/recruitment/screening-integrity-validate'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id: organizationId, sessionId } = await context.params
    const access = await requireOrganizationAccess(organizationId, SCREENING_WRITE_ROLES)
    if (!roleAllows(access.asPlatformAdmin, access.membership?.role, SCREENING_WRITE_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json()) as Record<string, unknown>
    delete body.technical_score
    delete body.technicalScore
    delete body.integrity_band
    delete body.integrityBand

    if (integrityApiMayModifyTechnicalScore()) {
      return NextResponse.json({ error: 'Misconfigured integrity API' }, { status: 500 })
    }

    const result = await recordIntegrityReview({
      organizationId,
      sessionId,
      reviewerUserId: access.user.id,
      outcome: String(body.outcome ?? ''),
      notes: body.notes != null ? String(body.notes) : null,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ review: result.review })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
