import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type OrderItemInput = {
  productId: string
  quantity: number
}

function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `EL-${stamp}-${rand}`
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
      return NextResponse.json(
        { error: 'Delivery address is required for delivery orders' },
        { status: 400 }
      )
    }

    const productIds = items.map((item) => item.productId)
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, price, discount, stock, status')
      .in('id', productIds)
      .eq('status', 'published')

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }

    const productMap = new Map((products ?? []).map((p) => [p.id, p]))
    let totalAmount = 0
    const lineItems: {
      product_id: string
      product_name: string
      quantity: number
      unit_price: number
      line_total: number
    }[] = []

    for (const item of items) {
      const product = productMap.get(item.productId)
      const quantity = Number(item.quantity)

      if (!product || !Number.isFinite(quantity) || quantity < 1) {
        return NextResponse.json({ error: 'Invalid cart item' }, { status: 400 })
      }
      if ((product.stock ?? 0) < quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock ?? 0}` },
          { status: 400 }
        )
      }

      const unitPrice = Number(product.price) - Number(product.discount ?? 0)
      const lineTotal = unitPrice * quantity
      totalAmount += lineTotal
      lineItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
      })
    }

    const orderNumber = generateOrderNumber()
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
          order_date: new Date().toISOString(),
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
        line_total: line.line_total,
      }))
    )

    if (itemsError) {
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    for (const line of lineItems) {
      const product = productMap.get(line.product_id)!
      const nextStock = Math.max(0, Number(product.stock ?? 0) - line.quantity)
      const updatePayload: Record<string, unknown> = {
        stock: nextStock,
        in_stock: nextStock > 0,
        updated_at: new Date().toISOString(),
      }
      const { error: stockError } = await supabaseAdmin
        .from('products')
        .update(updatePayload)
        .eq('id', line.product_id)

      if (stockError) {
        return NextResponse.json(
          {
            error: stockError.message,
            orderId: order.id,
            orderNumber,
            hint: 'Order was created but stock update failed. Admin should verify inventory.',
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        orderNumber,
        totalAmount,
        message:
          fulfillmentType === 'delivery'
            ? 'Order submitted. We will contact you to confirm delivery details.'
            : 'Order submitted. We will contact you when your order is ready for pickup in Kigali.',
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to submit order' }, { status: 500 })
  }
}
