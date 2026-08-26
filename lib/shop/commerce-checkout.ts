import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  buildOrderLines,
  generateOrderNumber,
  type BuiltOrderLine,
  type OrderLineInput,
} from '@/lib/shop/order-helpers'
import {
  beginIdempotentRequest,
  completeIdempotentRequest,
  failIdempotentRequest,
  fingerprintRequest,
} from '@/lib/shop/idempotency'
import {
  consumeStockForLines,
  createActiveReservations,
  convertReservationsForOrder,
  releaseReservationsForOrder,
} from '@/lib/shop/stock-ops'
import { normalizeIdempotencyKey } from '@/lib/shop/stock-types'
import { buildReceiptModel, type ReceiptModel } from '@/lib/shop/receipt-model'
import { toSafeCommerceClientError } from '@/lib/shop/commerce-errors'

export type CommerceChannel = 'pos' | 'online'
export type CommercePaymentMethod = 'cash' | 'momo'

export type CreateCommerceSaleInput = {
  channel: CommerceChannel
  items: OrderLineInput[]
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  fulfillmentType?: 'pickup' | 'delivery'
  deliveryAddress?: string | null
  notes?: string | null
  paymentMethod: CommercePaymentMethod
  /** Required for POS; optional for online (generated if missing). */
  idempotencyKey?: string | null
  actorUserId?: string | null
  receiptUrl?: string | null
  receiptNumber?: string | null
  /**
   * Server-resolved shop location attribution only.
   * Callers must not trust client-supplied location IDs.
   */
  locationId?: string | null
}

export type CreateCommerceSaleResult =
  | {
      ok: true
      replay?: boolean
      orderId: string
      orderNumber: string
      totalAmount: number
      paymentStatus: string
      stockState: string
      message: string
      receipt: ReceiptModel
      httpStatus: number
    }
  | { ok: false; error: string; httpStatus: number }

function paymentMethodLabel(channel: CommerceChannel, method: CommercePaymentMethod): string {
  if (channel === 'pos') {
    return method === 'cash' ? 'Cash (POS)' : 'MTN MoMo (POS)'
  }
  return 'MTN MoMo (manual)'
}

async function cleanupFailedOrder(orderId: string) {
  if (!supabaseAdmin) return
  await supabaseAdmin.from('payments').delete().eq('order_id', orderId)
  await supabaseAdmin.from('order_items').delete().eq('order_id', orderId)
  await supabaseAdmin.from('stock_reservations').delete().eq('order_id', orderId)
  await supabaseAdmin.from('orders').delete().eq('id', orderId)
}

/**
 * Shared checkout for web POS, mobile POS, and online shop.
 * Cash: consume stock as SALE. MoMo: reserve stock until payment decision.
 */
export async function createCommerceSale(
  input: CreateCommerceSaleInput
): Promise<CreateCommerceSaleResult> {
  if (!supabaseAdmin) {
    return { ok: false, error: 'Sale could not be completed.', httpStatus: 500 }
  }

  const paymentMethod: CommercePaymentMethod =
    input.channel === 'online' ? 'momo' : input.paymentMethod === 'momo' ? 'momo' : 'cash'

  const idempotencyKey =
    normalizeIdempotencyKey(input.idempotencyKey) ||
    (input.channel === 'pos' ? null : `online-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`)

  if (input.channel === 'pos' && !idempotencyKey) {
    return {
      ok: false,
      error: 'Idempotency key is required for POS sales (8–128 chars)',
      httpStatus: 400,
    }
  }

  const scope = `commerce_sale:${input.channel}`
  const fingerprint = fingerprintRequest({
    channel: input.channel,
    items: input.items,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone ?? null,
    paymentMethod,
    fulfillmentType: input.fulfillmentType ?? 'pickup',
    deliveryAddress: input.deliveryAddress ?? null,
    locationId: input.locationId ?? null,
  })

  if (idempotencyKey) {
    const gate = await beginIdempotentRequest({
      scope,
      idempotencyKey,
      actorUserId: input.actorUserId,
      requestFingerprint: fingerprint,
    })

    if (gate.kind === 'replay') {
      const body = gate.record.responseBody as CreateCommerceSaleResult
      if (body && typeof body === 'object' && 'ok' in body && body.ok) {
        return { ...body, replay: true, httpStatus: gate.record.responseStatus }
      }
      return {
        ok: false,
        error: 'Sale could not be completed.',
        httpStatus: 500,
      }
    }
    if (gate.kind === 'conflict') {
      const safe = toSafeCommerceClientError(gate.error, 409)
      return { ok: false, error: safe.error, httpStatus: safe.httpStatus }
    }
    if (gate.kind === 'error') {
      const safe = toSafeCommerceClientError(gate.error, 500)
      return { ok: false, error: safe.error, httpStatus: safe.httpStatus }
    }
  }

  const fail = async (
    rawError: string,
    httpStatus: number
  ): Promise<CreateCommerceSaleResult> => {
    const safe = toSafeCommerceClientError(rawError, httpStatus)
    if (idempotencyKey) {
      await failIdempotentRequest({
        scope,
        idempotencyKey,
        errorMessage: rawError,
      })
    }
    return { ok: false, error: safe.error, httpStatus: safe.httpStatus }
  }

  const built = await buildOrderLines(input.items)
  if (!built.order) {
    return fail(built.error || 'Invalid cart', 400)
  }

  const { lineItems, totalAmount } = built.order
  const orderNumber = generateOrderNumber(input.channel === 'pos' ? 'POS' : 'EL')
  const now = new Date().toISOString()
  const isPaidNow = paymentMethod === 'cash'
  const customerName = input.customerName.trim() || 'Walk-in customer'
  const customerEmail =
    input.customerEmail.trim() ||
    (input.channel === 'pos' ? 'pos@energyandlogics.com' : '')
  const fulfillmentType = input.fulfillmentType === 'delivery' ? 'delivery' : 'pickup'

  if (input.channel === 'online') {
    if (!customerName || !customerEmail || !String(input.customerPhone ?? '').trim()) {
      return fail('Name, email, and phone are required', 400)
    }
    if (fulfillmentType === 'delivery' && !String(input.deliveryAddress ?? '').trim()) {
      return fail('Delivery address is required for delivery orders', 400)
    }
  }

  const orderPayloadBase = {
    order_number: orderNumber,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: String(input.customerPhone ?? '').trim() || null,
    fulfillment_type: fulfillmentType,
    delivery_address:
      fulfillmentType === 'delivery' ? String(input.deliveryAddress ?? '').trim() : null,
    notes:
      input.notes?.trim() ||
      (input.channel === 'pos' ? 'POS sale' : null),
    total_amount: totalAmount,
    status: isPaidNow ? 'confirmed' : 'pending',
    payment_status: isPaidNow ? 'paid' : 'pending_review',
    payment_method: paymentMethod,
    channel: input.channel,
    created_by: input.actorUserId ?? null,
    paid_at: isPaidNow ? now : null,
    order_date: now,
    idempotency_key: idempotencyKey,
    stock_state: 'none',
  }

  let { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert([
      {
        ...orderPayloadBase,
        ...(input.locationId ? { location_id: input.locationId } : {}),
      },
    ])
    .select()
    .single()

  if (
    (orderError || !order) &&
    input.locationId &&
    /location_id/i.test(orderError?.message || '')
  ) {
    console.warn('[commerce] orders.location_id unavailable — inserting without location')
    const retry = await supabaseAdmin
      .from('orders')
      .insert([orderPayloadBase])
      .select()
      .single()
    order = retry.data
    orderError = retry.error
  }

  if (orderError || !order) {
    if (idempotencyKey && /duplicate|unique/i.test(orderError?.message || '')) {
      const gate = await beginIdempotentRequest({
        scope,
        idempotencyKey,
        actorUserId: input.actorUserId,
        requestFingerprint: fingerprint,
      })
      if (gate.kind === 'replay') {
        const body = gate.record.responseBody as CreateCommerceSaleResult
        if (body && typeof body === 'object' && 'ok' in body && body.ok) {
          return { ...body, replay: true, httpStatus: gate.record.responseStatus }
        }
      }
    }
    return fail(orderError?.message || 'Failed to create order', 500)
  }

  const { error: itemsError } = await supabaseAdmin.from('order_items').insert(
    lineItems.map((line: BuiltOrderLine) => ({
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
    await cleanupFailedOrder(order.id)
    return fail(itemsError.message, 500)
  }

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert([
      {
        amount: totalAmount,
        payer_name: customerName,
        payer_email: customerEmail,
        payer_phone: String(input.customerPhone ?? '').trim() || null,
        payment_method: paymentMethodLabel(input.channel, paymentMethod),
        order_id: order.id,
        status: isPaidNow ? 'approved' : 'pending_review',
        paid_at: isPaidNow ? now : null,
        receipt_url: input.receiptUrl || null,
        receipt_number: input.receiptNumber || null,
      },
    ])
    .select()
    .single()

  if (paymentError || !payment) {
    await cleanupFailedOrder(order.id)
    return fail(paymentError?.message || 'Failed to create payment', 500)
  }

  await supabaseAdmin
    .from('orders')
    .update({ payment_id: payment.id, updated_at: now })
    .eq('id', order.id)

  const stockLines = lineItems.map((line) => ({
    productId: line.product_id,
    quantity: line.quantity,
  }))

  if (isPaidNow) {
    const stockResult = await consumeStockForLines({
      lines: stockLines,
      movementType: 'SALE',
      orderId: order.id,
      actorUserId: input.actorUserId,
      reason: 'Cash POS sale',
    })
    if (stockResult.error) {
      await cleanupFailedOrder(order.id)
      return fail(stockResult.error, 409)
    }
    await supabaseAdmin
      .from('orders')
      .update({ stock_state: 'consumed', updated_at: new Date().toISOString() })
      .eq('id', order.id)
  } else {
    const stockResult = await consumeStockForLines({
      lines: stockLines,
      movementType: 'RESERVE',
      orderId: order.id,
      actorUserId: input.actorUserId,
      reason: 'MoMo payment pending — stock reserved',
    })
    if (stockResult.error) {
      await cleanupFailedOrder(order.id)
      return fail(stockResult.error, 409)
    }

    const reservation = await createActiveReservations({
      orderId: order.id,
      lines: stockLines,
    })
    if (reservation.error) {
      const { releaseStockForLines } = await import('@/lib/shop/stock-ops')
      await releaseStockForLines({
        lines: stockLines,
        orderId: order.id,
        actorUserId: input.actorUserId,
        reason: 'Rollback after reservation insert failure',
      })
      await cleanupFailedOrder(order.id)
      return fail(reservation.error, 500)
    }

    await supabaseAdmin
      .from('orders')
      .update({ stock_state: 'reserved', updated_at: new Date().toISOString() })
      .eq('id', order.id)
  }

  const receipt = buildReceiptModel({
    orderNumber,
    customerName,
    customerEmail,
    customerPhone: String(input.customerPhone ?? '').trim() || null,
    fulfillmentType,
    deliveryAddress:
      fulfillmentType === 'delivery' ? String(input.deliveryAddress ?? '').trim() : null,
    notes: input.notes ?? null,
    totalAmount,
    orderStatus: isPaidNow ? 'confirmed' : 'pending',
    paymentStatus: isPaidNow ? 'paid' : 'pending_review',
    paymentMethod: paymentMethodLabel(input.channel, paymentMethod),
    orderDate: now,
    items: lineItems.map((line) => ({
      productName: line.product_name,
      quantity: line.quantity,
      unitPrice: line.unit_price,
      lineTotal: line.line_total,
    })),
    channel: input.channel,
  })

  const success: CreateCommerceSaleResult = {
    ok: true,
    orderId: order.id,
    orderNumber,
    totalAmount,
    paymentStatus: isPaidNow ? 'paid' : 'pending_review',
    stockState: isPaidNow ? 'consumed' : 'reserved',
    message: isPaidNow
      ? 'Sale completed and stock updated.'
      : 'Order created — stock reserved until MoMo payment is confirmed.',
    receipt,
    httpStatus: input.channel === 'online' ? 201 : 200,
  }

  if (idempotencyKey) {
    await completeIdempotentRequest({
      scope,
      idempotencyKey,
      responseStatus: success.httpStatus,
      responseBody: success,
    })
  }

  return success
}

/** Convert MoMo reservation into completed sale after payment approval. */
export async function finalizeCommercePaymentApproval(input: {
  orderId: string
  actorUserId?: string | null
}): Promise<{ error?: string }> {
  return convertReservationsForOrder(input.orderId, input.actorUserId)
}

/** Release reserved stock when MoMo payment is rejected or order cancelled. */
export async function finalizeCommercePaymentRejection(input: {
  orderId: string
  actorUserId?: string | null
  reason?: string
}): Promise<{ error?: string }> {
  return releaseReservationsForOrder(
    input.orderId,
    input.actorUserId,
    input.reason || 'Payment rejected — stock released'
  )
}
