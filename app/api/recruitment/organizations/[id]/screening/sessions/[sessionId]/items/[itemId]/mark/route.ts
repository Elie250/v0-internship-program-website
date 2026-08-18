import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { APPLICATION_REVIEW_ROLES } from '@/lib/recruitment/rbac'
import { assertCanAccessScreeningSession } from '@/lib/recruitment/job-assignments'
import {
  applyManualItemMark,
  suggestOpenEndedItemMark,
} from '@/lib/recruitment/screening-sessions'

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string; sessionId: string; itemId: string }>
  }
) {
  try {
    const { id: organizationId, sessionId, itemId } = await context.params
    const access = await requireOrganizationAccess(organizationId, APPLICATION_REVIEW_ROLES)
    await assertCanAccessScreeningSession({ access, organizationId, sessionId })

    const body = await request.json().catch(() => ({}))
    const action = String(body.action ?? 'suggest')

    if (action === 'suggest') {
      const result = await suggestOpenEndedItemMark({
        organizationId,
        sessionId,
        itemId,
        preferAi: body.preferAi !== false,
      })
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json({
        ...result,
        message:
          'Suggestion only — confirm or edit the points, then apply. This does not change the score until you apply.',
      })
    }

    if (action === 'apply') {
      const result = await applyManualItemMark({
        organizationId,
        sessionId,
        itemId,
        actorUserId: access.user.id,
        pointsAwarded: Number(body.pointsAwarded),
        note: body.note != null ? String(body.note) : null,
      })
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json({
        ...result,
        message: 'Open-ended mark applied. Technical score recalculated.',
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
