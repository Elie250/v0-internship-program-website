import { NextResponse } from 'next/server'
import { createCommerceSale } from '@/lib/shop/commerce-checkout'

type OrderItemInput = {
  productId: string
  quantity: number
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const items: OrderItemInput[] = body.items ?? []
    const customerName = String(body.customerName ?? '').trim()
    const customerEmail = String(body.customerEmail ?? '').trim()
    const customerPhone = String(body.customerPhone ?? '').trim()
    const fulfillmentType = body.fulfillmentType === 'delivery' ? 'delivery' : 'pickup'
    const deliveryAddress = String(body.deliveryAddress ?? '').trim()
    const notes = String(body.notes ?? '').trim()
    const receiptUrl = String(body.receiptUrl ?? '').trim()
    const receiptNumber = String(body.receiptNumber ?? '').trim()

    if (!items.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const result = await createCommerceSale({
      channel: 'online',
      items,
      customerName,
      customerEmail,
      customerPhone,
      fulfillmentType,
      deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress : null,
      notes: notes || null,
      paymentMethod: 'momo',
      receiptUrl: receiptUrl || null,
      receiptNumber: receiptNumber || null,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }

    return NextResponse.json(
      {
        success: true,
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        totalAmount: result.totalAmount,
        stockState: result.stockState,
        message:
          fulfillmentType === 'delivery'
            ? 'Order submitted. We will verify your MoMo payment and contact you for delivery.'
            : 'Order submitted. We will verify your MoMo payment and notify you when ready for pickup.',
      },
      { status: result.httpStatus }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to submit order' }, { status: 500 })
  }
}
