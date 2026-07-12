import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  buildOrderLines,
  decrementStockForLines,
  generateOrderNumber,
} from '@/lib/shop/order-helpers'

type OrderItemInput = {
  productId: string
  quantity: number
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const items: OrderItemInput[] = body.items ?? []
    const customerName = String(body.customerName ?? '').trim()
    const customerEmail = String(body.customerEmail ?? '').trim()
    const customerPhone = String(body.customerPhone ?? '').trim()
    const fulfillmentType = body.fulfillmentType === 'delivery' ? 'delivery' : 'pickup'
    const deliveryAddress = String(body.deliveryAddress ?? '').trim()
    const notes = String(body.notes ?? '').trim()
    const paymentMethod = 'momo'
    const receiptUrl = String(body.receiptUrl ?? '').trim()
    const receiptNumber = String(body.receiptNumber ?? '').trim()

    if (!items.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }
    if (!customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required so we can contact you' },
        { status: 400 }
      )
    }
    if (fulfillmentType === 'delivery' && !deliveryAddress) {
      return NextResponse.json({ error: 'Delivery address is required for delivery orders' }, { status: 400 })
    }

    const built = await buildOrderLines(items)
    if (!built.order) {
      return NextResponse.json({ error: built.error || 'Invalid cart' }, { status: 400 })
    }

    const { lineItems, totalAmount, productMap } = built.order
    const orderNumber = generateOrderNumber()
    const now = new Date().toISOString()

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([
        {
          order_number: orderNumber,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          fulfillment_type: fulfillmentType,
          delivery_address: fulfillmentType === 'delivery' ? deliveryAddress : null,
          notes: notes || null,
          total_amount: totalAmount,
          status: 'pending',
          payment_status: 'pending_review',
          payment_method: paymentMethod,
          channel: 'online',
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
          payer_phone: customerPhone,
          payment_method: 'MTN MoMo (manual)',
          order_id: order.id,
          status: 'pending_review',
          receipt_url: receiptUrl || null,
          receipt_number: receiptNumber || null,
          currency: 'RWF',
        },
      ])
      .select()
      .single()

    if (paymentError || !payment) {
      await supabaseAdmin.from('order_items').delete().eq('order_id', order.id)
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: paymentError?.message || 'Failed to create payment record' }, { status: 500 })
    }

    await supabaseAdmin
      .from('orders')
      .update({ payment_id: payment.id, updated_at: now })
      .eq('id', order.id)

    const stockResult = await decrementStockForLines(lineItems, productMap)
    if (stockResult.error) {
      return NextResponse.json(
        {
          success: true,
          orderId: order.id,
          orderNumber,
          totalAmount,
          warning: 'Order submitted but stock update failed. Admin will verify.',
          message:
            fulfillmentType === 'delivery'
              ? 'Order submitted with MoMo receipt. We will verify payment and contact you for delivery.'
              : 'Order submitted with MoMo receipt. We will verify payment and notify you for pickup.',
        },
        { status: 201 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        orderNumber,
        totalAmount,
        message:
          fulfillmentType === 'delivery'
            ? 'Order submitted. We will verify your MoMo payment and contact you for delivery.'
            : 'Order submitted. We will verify your MoMo payment and notify you when ready for pickup.',
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to submit order' }, { status: 500 })
  }
}
