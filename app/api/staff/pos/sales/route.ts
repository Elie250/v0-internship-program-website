import { NextResponse } from 'next/server'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { requireStaffPermission } from '@/lib/staff/context'
import { assertStaffMutationAllowed } from '@/lib/staff/request-auth'
import { createCommerceSale } from '@/lib/shop/commerce-checkout'
import { normalizeIdempotencyKey } from '@/lib/shop/stock-types'

/**
 * Staff POS sale endpoint (mobile + future clients).
 * Shared business logic with web admin POS via createCommerceSale.
 * Shop web (1C.7): cash only in the UI — MoMo remains supported by this API for later phases.
 */
export async function POST(request: Request) {
  try {
    const csrf = assertStaffMutationAllowed(request)
    if (!csrf.ok) {
      return NextResponse.json({ error: csrf.error }, { status: 403 })
    }

    const auth = await requireStaffPermission(request, PERMISSIONS.SHOP_POS_SELL)
    if ('response' in auth) return auth.response

    const body = await request.json()
    const idempotencyKey =
      normalizeIdempotencyKey(body.idempotencyKey) ||
      normalizeIdempotencyKey(request.headers.get('idempotency-key'))

    const result = await createCommerceSale({
      channel: 'pos',
      items: Array.isArray(body.items) ? body.items : [],
      customerName: String(body.customerName ?? 'Walk-in customer'),
      customerEmail: String(body.customerEmail ?? 'pos@energyandlogics.com'),
      customerPhone: body.customerPhone != null ? String(body.customerPhone) : null,
      notes: body.notes != null ? String(body.notes) : null,
      paymentMethod: body.paymentMethod === 'momo' ? 'momo' : 'cash',
      idempotencyKey,
      actorUserId: auth.ctx.user.id,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }

    return NextResponse.json(
      {
        success: true,
        replay: Boolean(result.replay),
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        totalAmount: result.totalAmount,
        paymentStatus: result.paymentStatus,
        stockState: result.stockState,
        message: result.message,
        receipt: result.receipt,
      },
      { status: result.httpStatus }
    )
  } catch {
    return NextResponse.json({ error: 'POS sale failed' }, { status: 500 })
  }
}
