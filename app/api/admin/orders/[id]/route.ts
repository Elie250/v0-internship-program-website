import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'

const CANCELLED_STATUSES = new Set(['cancelled', 'Canceled', 'Cancelled'])

async function restoreStock(orderId: string) {
  if (!supabaseAdmin) return

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)

  for (const item of items ?? []) {
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .maybeSingle()

    const nextStock = Number(product?.stock ?? 0) + Number(item.quantity)
    await supabaseAdmin
      .from('products')
      .update({ stock: nextStock, in_stock: nextStock > 0, updated_at: new Date().toISOString() })
      .eq('id', item.product_id)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.SHOP_ORDERS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await params
    const body = await request.json()
    const nextStatus = body.status ? String(body.status) : undefined

    const { data: existing } = await supabaseAdmin
      .from('orders')
      .select('status')
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
      await restoreStock(id)
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
    await requireAdminPermission(PERMISSIONS.SHOP_ORDERS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await params

    const { data: existing } = await supabaseAdmin
      .from('orders')
      .select('id, status, payment_status')
      .eq('id', id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const previousStatus = String(existing.status ?? '').toLowerCase()
    if (!CANCELLED_STATUSES.has(previousStatus)) {
      await restoreStock(id)
    }

    await supabaseAdmin.from('payments').delete().eq('order_id', id)
    await supabaseAdmin.from('order_items').delete().eq('order_id', id)

    const { error } = await supabaseAdmin.from('orders').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete order'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
