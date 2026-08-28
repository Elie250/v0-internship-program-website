import { NextResponse } from 'next/server'
import { requireStaffPermission } from '@/lib/staff/context'
import { assertStaffMutationAllowed } from '@/lib/staff/request-auth'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import { requestShopRefund } from '@/lib/shop/refunds/service'
import { normalizeIdempotencyKey } from '@/lib/shop/stock-types'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const csrf = assertStaffMutationAllowed(request)
    if (!csrf.ok) {
      return NextResponse.json({ error: csrf.error }, { status: 403 })
    }

    const auth = await requireStaffPermission(request, STAFF_API_PERMISSIONS.refundsRequest)
    if ('response' in auth) return auth.response

    const { id } = await context.params
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const idempotencyKey =
      normalizeIdempotencyKey(body.idempotencyKey) ||
      normalizeIdempotencyKey(request.headers.get('idempotency-key'))

    const result = await requestShopRefund({
      orderId: id,
      actorUserId: auth.ctx.user.id,
      body,
      idempotencyKey,
    })
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }
    return NextResponse.json(result.body, { status: result.httpStatus })
  } catch {
    return NextResponse.json({ error: 'Refund could not be submitted.' }, { status: 500 })
  }
}
