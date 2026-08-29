import { NextResponse } from 'next/server'
import { createCommerceSale } from '@/lib/shop/commerce-checkout'
import {
  PUBLIC_CART_CHANGED_MESSAGE,
  PUBLIC_CHECKOUT_CART_CHANGED,
  resolvePublicCheckoutItems,
  toPublicShopOrderResponse,
} from '@/lib/shop/public-checkout'
import { resolveShopPortalPosLocation } from '@/lib/shop/resolve-pos-location'
import { getDefaultStorefrontShop } from '@/lib/shop/storefront-shops'
import { normalizeIdempotencyKey } from '@/lib/shop/stock-types'

function cartChangedResponse() {
  return NextResponse.json(
    { error: PUBLIC_CART_CHANGED_MESSAGE, code: PUBLIC_CHECKOUT_CART_CHANGED },
    { status: 409 }
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const customerName = String(body.customerName ?? '').trim()
    const customerEmail = String(body.customerEmail ?? '').trim()
    const customerPhone = String(body.customerPhone ?? '').trim()
    const fulfillmentType = body.fulfillmentType === 'delivery' ? 'delivery' : 'pickup'
    const deliveryAddress = String(body.deliveryAddress ?? '').trim()
    const notes = String(body.notes ?? '').trim()
    const receiptUrl = String(body.receiptUrl ?? '').trim()
    const receiptNumber = String(body.receiptNumber ?? '').trim()

    // Never trust client-supplied location, prices, totals, stock, or product UUIDs
    // as commerce authority. Location is always resolved server-side (Nyanza).
    const portalLocation = await resolveShopPortalPosLocation()
    const resolved = await resolvePublicCheckoutItems(body.items)

    if (!resolved.ok) {
      if (resolved.code === 'EMPTY') {
        return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
      }
      if (resolved.code === 'INVALID') {
        return NextResponse.json({ error: 'Invalid cart' }, { status: 400 })
      }
      return cartChangedResponse()
    }

    const idempotencyKey =
      normalizeIdempotencyKey(body.idempotencyKey) ||
      normalizeIdempotencyKey(request.headers.get('idempotency-key'))

    const result = await createCommerceSale({
      channel: 'online',
      items: resolved.items,
      customerName,
      customerEmail,
      customerPhone,
      fulfillmentType,
      deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress : null,
      notes: notes || null,
      paymentMethod: 'momo',
      receiptUrl: receiptUrl || null,
      receiptNumber: receiptNumber || null,
      locationId: portalLocation?.id ?? null,
      idempotencyKey,
    })

    if (!result.ok) {
      if (
        resolved.usedPublicSlugs &&
        /insufficient stock|invalid cart/i.test(result.error)
      ) {
        return cartChangedResponse()
      }
      return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    }

    const shop = getDefaultStorefrontShop()
    return NextResponse.json(
      toPublicShopOrderResponse({
        orderNumber: result.orderNumber,
        totalAmount: result.totalAmount,
        shopName: shop.name,
        fulfillmentType,
      }),
      { status: result.httpStatus }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to submit order' }, { status: 500 })
  }
}
