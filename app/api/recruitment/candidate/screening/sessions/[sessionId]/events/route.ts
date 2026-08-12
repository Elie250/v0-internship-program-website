import { NextResponse } from 'next/server'
import { getRecruitmentSessionUser } from '@/lib/recruitment/authz'
import { ingestScreeningIntegrityEvent } from '@/lib/recruitment/screening-integrity'
import {
  clientMaySetIntegrityBand,
  integrityApiMayModifyTechnicalScore,
} from '@/lib/recruitment/screening-integrity-validate'

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { sessionId } = await context.params
    const body = (await request.json()) as Record<string, unknown>

    // Strip any client attempts to set integrity or scores
    delete body.integrity_band
    delete body.integrityBand
    delete body.riskScore
    delete body.severity
    delete body.technical_score
    delete body.technicalScore
    delete body.server_received_at
    delete body.serverReceivedAt

    if (clientMaySetIntegrityBand() || integrityApiMayModifyTechnicalScore()) {
      return NextResponse.json({ error: 'Misconfigured integrity API' }, { status: 500 })
    }

    const result = await ingestScreeningIntegrityEvent({
      sessionId,
      candidateUserId: user.id,
      body,
    })
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.flooded ? 429 : 400 }
      )
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Could not record event' }, { status: 500 })
  }
}
