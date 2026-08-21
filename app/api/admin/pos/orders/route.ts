import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/actions/admin-context'
import { hasPermission, PERMISSIONS } from '@/lib/admin/permissions'
import { createCommerceSale } from '@/lib/shop/commerce-checkout'
import { createIdempotencyKey } from '@/lib/shop/idempotency'
import { normalizeIdempotencyKey } from '@/lib/shop/stock-types'

type PosItem = { productId: string; quantity: number }

/**
 * Web admin POS — uses the same createCommerceSale service as mobile staff POS.
 */
export async function POST(request: Request) {
  try {
    const session = await getAdminSession()
    if (
      !session ||
      !hasPermission(session.user.permissions, [
        PERMISSIONS.SHOP_ORDERS,
        PERMISSIONS.SHOP_POS_SELL,
      ])
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const items: PosItem[] = body.items ?? []
    const idempotencyKey =
      normalizeIdempotencyKey(body.idempotencyKey) ||
      normalizeIdempotencyKey(request.headers.get('idempotency-key')) ||
      createIdempotencyKey()

    const result = await createCommerceSale({
      channel: 'pos',
      items,
      customerName: String(body.customerName ?? 'Walk-in customer').trim(),
      customerEmail: String(body.customerEmail ?? 'pos@energyandlogics.com').trim(),
      customerPhone: String(body.customerPhone ?? '').trim() || null,
      notes: String(body.notes ?? '').trim() || null,
      paymentMethod: body.paymentMethod === 'momo' ? 'momo' : 'cash',
      idempotencyKey,
      actorUserId: session.user.id,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }

    return NextResponse.json({
      success: true,
      replay: Boolean(result.replay),
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      totalAmount: result.totalAmount,
      paymentStatus: result.paymentStatus === 'paid' ? 'paid' : 'pending',
      stockState: result.stockState,
      message: result.message,
      receipt: result.receipt,
    })
  } catch {
    return NextResponse.json({ error: 'POS sale failed' }, { status: 500 })
  }
}
