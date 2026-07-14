import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/actions/admin-context'
import { hasPermission, PERMISSIONS } from '@/lib/admin/permissions'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  buildOrderLines,
  decrementStockForLines,
  generateOrderNumber,
} from '@/lib/shop/order-helpers'

type PosItem = { productId: string; quantity: number }

export async function POST(request: Request) {
  try {
    const session = await getAdminSession()
    if (!session || !hasPermission(session.user.permissions, PERMISSIONS.SHOP_ORDERS)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const items: PosItem[] = body.items ?? []
    const customerName = String(body.customerName ?? 'Walk-in customer').trim()
    const customerPhone = String(body.customerPhone ?? '').trim()
    const customerEmail = String(body.customerEmail ?? 'pos@energyandlogics.com').trim()
    const paymentMethod = ['cash', 'momo'].includes(body.paymentMethod)
      ? body.paymentMethod
      : 'cash'
    const notes = String(body.notes ?? '').trim()

    const built = await buildOrderLines(items)
    if (!built.order) {
      return NextResponse.json({ error: built.error || 'Invalid cart' }, { status: 400 })
    }

    const { lineItems, totalAmount, productMap } = built.order
    const orderNumber = generateOrderNumber('POS')
    const now = new Date().toISOString()
    const isPaidNow = paymentMethod === 'cash'

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([
        {
          order_number: orderNumber,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || null,
          fulfillment_type: 'pickup',
          notes: notes || 'POS sale',
          total_amount: totalAmount,
          status: isPaidNow ? 'confirmed' : 'pending',
          payment_status: isPaidNow ? 'paid' : 'pending_review',
          payment_method: paymentMethod,
          channel: 'pos',
          created_by: session.user.id,
          paid_at: isPaidNow ? now : null,
          order_date: now,
        },
      ])
      .select()
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message || 'Failed to create order' }, { status: 500 })
    }

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(
      lineItems.map((line) => ({
        order_id: order.id,
        product_id: line.product_id,
        product_name: line.product_name,
        quantity: line.quantity,
        unit_price: line.unit_price,
        unit_cost: line.unit_cost,
        line_total: line.line_total,
      }))
    )

    if (itemsError) {
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert([
        {
          amount: totalAmount,
          payer_name: customerName,
          payer_email: customerEmail,
          payer_phone: customerPhone || null,
          payment_method:
            paymentMethod === 'cash'
              ? 'Cash (POS)'
              : 'MTN MoMo (POS)',
          order_id: order.id,
          status: isPaidNow ? 'approved' : 'pending_review',
          paid_at: isPaidNow ? now : null,
        },
      ])
      .select()
      .single()

    if (paymentError || !payment) {
      await supabaseAdmin.from('order_items').delete().eq('order_id', order.id)
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: paymentError?.message || 'Failed to create payment' }, { status: 500 })
    }

    await supabaseAdmin
      .from('orders')
      .update({ payment_id: payment.id, updated_at: now })
      .eq('id', order.id)

    if (isPaidNow) {
      const stockResult = await decrementStockForLines(lineItems, productMap)
      if (stockResult.error) {
        return NextResponse.json({
          success: true,
          orderNumber,
          orderId: order.id,
          warning: 'Order recorded but stock update failed — verify inventory.',
        })
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber,
      totalAmount,
      paymentStatus: isPaidNow ? 'paid' : 'pending',
      message: isPaidNow
        ? 'POS sale completed and stock updated.'
        : 'POS order created — complete payment to finalize.',
    })
  } catch {
    return NextResponse.json({ error: 'POS sale failed' }, { status: 500 })
  }
}
