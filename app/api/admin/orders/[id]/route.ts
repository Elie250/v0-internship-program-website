import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getAdminSession } from '@/app/actions/admin-context'
import { hasPermission, PERMISSIONS } from '@/lib/admin/permissions'
import {
  finalizeCommercePaymentRejection,
} from '@/lib/shop/commerce-checkout'
import { releaseStockForLines } from '@/lib/shop/stock-ops'

const CANCELLED_STATUSES = new Set(['cancelled', 'canceled'])

async function restoreOrderStock(orderId: string, actorUserId?: string | null) {
  if (!supabaseAdmin) return

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, stock_state, channel, payment_status, payment_method')
    .eq('id', orderId)
    .maybeSingle()

  if (!order) return

  const stockState = String(order.stock_state ?? 'none')

  if (stockState === 'released') return

  if (stockState === 'reserved') {
    await finalizeCommercePaymentRejection({
      orderId,
      actorUserId,
      reason: 'Order cancelled — reserved stock released',
    })
    return
  }

  if (stockState === 'consumed') {
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId)

    const lines = (items ?? []).map((item) => ({
      productId: item.product_id as string,
      quantity: Number(item.quantity),
    }))

    if (!lines.length) return

    await releaseStockForLines({
      lines,
      orderId,
      actorUserId,
      reason: 'Order cancelled — stock returned',
    })

    await supabaseAdmin
      .from('orders')
      .update({ stock_state: 'released', updated_at: new Date().toISOString() })
      .eq('id', orderId)
    return
  }

  // Legacy orders (no stock_state): only restore when stock was likely taken.
  const { data: activeReservations } = await supabaseAdmin
    .from('stock_reservations')
    .select('id')
    .eq('order_id', orderId)
    .eq('status', 'active')
    .limit(1)

  if (activeReservations?.length) {
    await finalizeCommercePaymentRejection({
      orderId,
      actorUserId,
      reason: 'Order cancelled — reserved stock released',
    })
    return
  }

  const paymentStatus = String(order.payment_status ?? '')
  const channel = String(order.channel ?? 'online')
  const stockLikelyTaken =
    paymentStatus === 'paid' ||
    channel === 'online' ||
    (channel === 'pos' && paymentStatus === 'paid')

  if (!stockLikelyTaken) return

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)

  const lines = (items ?? []).map((item) => ({
    productId: item.product_id as string,
    quantity: Number(item.quantity),
  }))

  if (!lines.length) return

  await releaseStockForLines({
    lines,
    orderId,
    actorUserId,
    reason: 'Legacy order cancel — stock returned',
  })

  await supabaseAdmin
    .from('orders')
    .update({ stock_state: 'released', updated_at: new Date().toISOString() })
    .eq('id', orderId)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession()
    if (
      !session ||
      !hasPermission(session.user.permissions, [
        PERMISSIONS.SHOP_ORDERS,
        PERMISSIONS.SHOP_ORDERS_MANAGE,
      ])
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await params
    const body = await request.json()
    const nextStatus = body.status ? String(body.status) : undefined

    const { data: existing } = await supabaseAdmin
      .from('orders')
      .select('status, stock_state')
      .eq('id', id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const previousStatus = String(existing.status ?? '').toLowerCase()
    const normalizedNext = nextStatus?.toLowerCase()

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (nextStatus) updatePayload.status = nextStatus
    if (body.adminNotes !== undefined) updatePayload.notes = body.adminNotes

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select('*, items:order_items(*)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (
      normalizedNext &&
      CANCELLED_STATUSES.has(normalizedNext) &&
      !CANCELLED_STATUSES.has(previousStatus)
    ) {
      await restoreOrderStock(id, session.user.id)
    }

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update order'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession()
    if (
      !session ||
      !hasPermission(session.user.permissions, [
        PERMISSIONS.SHOP_ORDERS,
        PERMISSIONS.SHOP_ORDERS_MANAGE,
      ])
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await params

    const { data: existing } = await supabaseAdmin
      .from('orders')
      .select('id, status, payment_status, stock_state')
      .eq('id', id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const previousStatus = String(existing.status ?? '').toLowerCase()
    if (!CANCELLED_STATUSES.has(previousStatus)) {
      await restoreOrderStock(id, session.user.id)
    }

    await supabaseAdmin.from('payments').delete().eq('order_id', id)
    await supabaseAdmin.from('order_items').delete().eq('order_id', id)
    await supabaseAdmin.from('stock_reservations').delete().eq('order_id', id)

    const { error } = await supabaseAdmin.from('orders').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete order'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
