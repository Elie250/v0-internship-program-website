import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  createIremboPayInvoice,
  generateIremboTransactionId,
  isIremboPayEnabled,
} from '@/lib/payments/irembopay'
import {
  buildOrderLines,
  generateOrderNumber,
} from '@/lib/shop/order-helpers'

export async function POST(request: Request) {
  try {
    if (!isIremboPayEnabled()) {
      return NextResponse.json({ error: 'IremboPay is not configured yet.' }, { status: 503 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const items = body.items ?? []
    const customerName = String(body.customerName ?? '').trim()
    const customerEmail = String(body.customerEmail ?? '').trim()
    const customerPhone = String(body.customerPhone ?? '').trim()
    const fulfillmentType = body.fulfillmentType === 'delivery' ? 'delivery' : 'pickup'
    const deliveryAddress = String(body.deliveryAddress ?? '').trim()
    const notes = String(body.notes ?? '').trim()
    const orderId = body.orderId ? String(body.orderId) : null

    if (!customerName || !customerEmail || !customerPhone) {
      return NextResponse.json({ error: 'Name, email, and phone are required' }, { status: 400 })
    }

    let order: { id: string; order_number: string; total_amount: number } | null = null

    if (orderId) {
      const { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, total_amount, payment_status')
        .eq('id', orderId)
        .maybeSingle()

      if (!existingOrder) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      order = existingOrder
    } else {
      const built = await buildOrderLines(items)
      if (!built.order) {
        return NextResponse.json({ error: built.error || 'Invalid cart' }, { status: 400 })
      }

      const lineItems = built.order.lineItems
      const orderNumber = generateOrderNumber()
      const { data: newOrder, error: orderError } = await supabaseAdmin
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
            total_amount: built.order.totalAmount,
            status: 'pending',
            payment_status: 'gateway_pending',
            payment_method: 'irembopay',
            channel: 'online',
            order_date: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (orderError || !newOrder) {
        return NextResponse.json({ error: orderError?.message || 'Failed to create order' }, { status: 500 })
      }

      const { error: itemsError } = await supabaseAdmin.from('order_items').insert(
        lineItems.map((line) => ({
          order_id: newOrder.id,
          product_id: line.product_id,
          product_name: line.product_name,
          quantity: line.quantity,
          unit_price: line.unit_price,
          unit_cost: line.unit_cost,
          line_total: line.line_total,
        }))
      )

      if (itemsError) {
        await supabaseAdmin.from('orders').delete().eq('id', newOrder.id)
        return NextResponse.json({ error: itemsError.message }, { status: 500 })
      }

      order = newOrder
    }

    const txRef = generateIremboTransactionId(`shop-${String(order!.id).slice(0, 8)}`)
    const totalAmount = Number(order!.total_amount)

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert([
        {
          amount: totalAmount,
          payer_name: customerName,
          payer_email: customerEmail,
          payer_phone: customerPhone,
          payment_method: 'IremboPay (products)',
          order_id: order!.id,
          status: 'gateway_pending',
          gateway_provider: 'irembopay',
          gateway_reference: txRef,
          currency: 'RWF',
        },
      ])
      .select()
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: paymentError?.message || 'Failed to create payment' }, { status: 500 })
    }

    await supabaseAdmin
      .from('orders')
      .update({
        payment_id: payment.id,
        payment_status: 'gateway_pending',
        payment_method: 'irembopay',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order!.id)

    const invoiceResult = await createIremboPayInvoice({
      transactionId: txRef,
      unitAmount: totalAmount,
      description: `Product order ${order!.order_number} — Energy & Logics`,
      customer: {
        email: customerEmail,
        name: customerName,
        phoneNumber: customerPhone,
      },
    })

    if (!invoiceResult.invoice) {
      await supabaseAdmin.from('payments').delete().eq('id', payment.id)
      return NextResponse.json({ error: invoiceResult.error || 'Could not create payment invoice' }, { status: 502 })
    }

    await supabaseAdmin
      .from('payments')
      .update({
        gateway_transaction_id: invoiceResult.invoice.invoiceNumber,
        receipt_number: invoiceResult.invoice.invoiceNumber,
        currency: invoiceResult.invoice.currency ?? 'RWF',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    return NextResponse.json({
      orderId: order!.id,
      orderNumber: order!.order_number,
      paymentLinkUrl: invoiceResult.invoice.paymentLinkUrl,
      invoiceNumber: invoiceResult.invoice.invoiceNumber,
      transactionId: txRef,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to start payment' }, { status: 500 })
  }
}
