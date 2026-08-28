import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseOptionalUuid } from '@/lib/shop/staff-api/common'
import {
  beginIdempotentRequest,
  completeIdempotentRequest,
  failIdempotentRequest,
  fingerprintRequest,
} from '@/lib/shop/idempotency'
import { restoreStockForReturn, rollbackRestoredReturn } from '@/lib/shop/stock-ops'
import { normalizeIdempotencyKey } from '@/lib/shop/stock-types'
import { toSafeCommerceClientError } from '@/lib/shop/commerce-errors'
import {
  REFUND_REASON_IDS,
  aggregateRefundStatus,
  isPosRefundEligibleOrder,
  refundLineAmount,
  refundReasonRequiresNotes,
  refundRequestFingerprint,
  refundableQuantity,
  type ShopRefundRecordStatus,
  type ShopRefundStatus,
} from '@/lib/shop/refunds/policy'

const FORBIDDEN_CLIENT_FIELDS = [
  'amount',
  'total',
  'totalAmount',
  'unitPrice',
  'price',
  'stock',
  'userId',
  'paymentStatus',
  'paymentMethod',
  'productPrice',
]

type ServiceFail = { error: string; httpStatus: number }
type RefundLineRow = {
  id: string
  refund_id: string
  order_item_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
}

function rejectedClientFields(body: Record<string, unknown>): ServiceFail | null {
  if (FORBIDDEN_CLIENT_FIELDS.some((key) => body[key] !== undefined)) {
    return {
      error: 'Refund amount and stock are calculated by the server',
      httpStatus: 400,
    }
  }
  return null
}

function missingRelation(message: string | undefined): boolean {
  return /shop_refunds|shop_refund_lines|does not exist|schema cache/i.test(message || '')
}

function mapRefund(row: Record<string, unknown>, lines: RefundLineRow[] = []) {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    status: String(row.status) as ShopRefundRecordStatus,
    reason: String(row.reason),
    notes: row.notes != null ? String(row.notes) : null,
    paymentMethod: String(row.payment_method),
    amount: Number(row.amount ?? 0),
    requestedAt: row.requested_at != null ? String(row.requested_at) : null,
    decidedAt: row.decided_at != null ? String(row.decided_at) : null,
    items: lines.map((line) => ({
      orderItemId: String(line.order_item_id),
      productName: String(line.product_name),
      quantity: Number(line.quantity),
      unitPrice: Number(line.unit_price),
      lineTotal: Number(line.line_total),
    })),
  }
}

export async function loadRefundSummariesByOrderIds(orderIds: string[]): Promise<
  Map<string, { refundStatus: ShopRefundStatus; refundedAmount: number }>
> {
  const map = new Map<string, { refundStatus: ShopRefundStatus; refundedAmount: number }>()
  if (!supabaseAdmin || !orderIds.length) return map

  const { data: refunds, error } = await supabaseAdmin
    .from('shop_refunds')
    .select('id, order_id, status, amount')
    .in('order_id', orderIds)

  if (error) {
    if (!missingRelation(error.message)) {
      console.error('[shop-refunds] list load failed:', error.message)
    }
    return map
  }

  const refundIds = (refunds ?? []).map((row) => String(row.id))
  const { data: lines } = refundIds.length
    ? await supabaseAdmin
        .from('shop_refund_lines')
        .select('refund_id, quantity')
        .in('refund_id', refundIds)
    : { data: [] as Array<{ refund_id: string; quantity: number }> }

  const qtyByRefund = new Map<string, number>()
  for (const line of lines ?? []) {
    const id = String(line.refund_id)
    qtyByRefund.set(id, (qtyByRefund.get(id) ?? 0) + Number(line.quantity ?? 0))
  }

  const { data: soldRows } = await supabaseAdmin
    .from('order_items')
    .select('order_id, quantity')
    .in('order_id', orderIds)
  const soldByOrder = new Map<string, number>()
  for (const row of soldRows ?? []) {
    const orderId = String(row.order_id)
    soldByOrder.set(orderId, (soldByOrder.get(orderId) ?? 0) + Number(row.quantity ?? 0))
  }

  const grouped = new Map<
    string,
    { approvedQty: number; requestedQty: number; approvedAmount: number; hasRejected: boolean }
  >()
  for (const row of refunds ?? []) {
    const orderId = String(row.order_id)
    const current = grouped.get(orderId) ?? {
      approvedQty: 0,
      requestedQty: 0,
      approvedAmount: 0,
      hasRejected: false,
    }
    const qty = qtyByRefund.get(String(row.id)) ?? 0
    if (row.status === 'approved') {
      current.approvedQty += qty
      current.approvedAmount += Number(row.amount ?? 0)
    } else if (row.status === 'requested') {
      current.requestedQty += qty
    } else if (row.status === 'rejected') {
      current.hasRejected = true
    }
    grouped.set(orderId, current)
  }

  for (const [orderId, stats] of grouped) {
    map.set(orderId, {
      refundStatus: aggregateRefundStatus({
        soldQuantity: soldByOrder.get(orderId) ?? 0,
        approvedQuantity: stats.approvedQty,
        requestedQuantity: stats.requestedQty,
        hasRejected: stats.hasRejected,
      }),
      refundedAmount: stats.approvedAmount,
    })
  }

  return map
}

export async function loadOrderRefundView(orderId: string, soldByItem: Map<string, number>) {
  const empty = {
    refundStatus: 'none' as ShopRefundStatus,
    refundedAmount: 0,
    refunds: [] as ReturnType<typeof mapRefund>[],
    committedByItem: new Map<string, number>(),
  }
  if (!supabaseAdmin) return empty

  const { data: refunds, error } = await supabaseAdmin
    .from('shop_refunds')
    .select(
      'id, order_id, status, reason, notes, payment_method, amount, requested_at, decided_at, requested_by, decided_by'
    )
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  if (error) {
    if (!missingRelation(error.message)) {
      console.error('[shop-refunds] order load failed:', error.message)
    }
    return empty
  }

  const refundIds = (refunds ?? []).map((row) => String(row.id))
  const { data: lines } = refundIds.length
    ? await supabaseAdmin.from('shop_refund_lines').select('*').in('refund_id', refundIds)
    : { data: [] as RefundLineRow[] }

  const linesByRefund = new Map<string, RefundLineRow[]>()
  const committedByItem = new Map<string, number>()
  let approvedQty = 0
  let requestedQty = 0
  let approvedAmount = 0
  let hasRejected = false

  for (const line of (lines ?? []) as RefundLineRow[]) {
    const refundId = String(line.refund_id)
    const list = linesByRefund.get(refundId) ?? []
    list.push(line)
    linesByRefund.set(refundId, list)
  }

  for (const row of refunds ?? []) {
    const rowLines = linesByRefund.get(String(row.id)) ?? []
    const qty = rowLines.reduce((sum, line) => sum + Number(line.quantity ?? 0), 0)
    if (row.status === 'approved' || row.status === 'requested') {
      for (const line of rowLines) {
        const itemId = String(line.order_item_id)
        committedByItem.set(itemId, (committedByItem.get(itemId) ?? 0) + Number(line.quantity ?? 0))
      }
    }
    if (row.status === 'approved') {
      approvedQty += qty
      approvedAmount += Number(row.amount ?? 0)
    } else if (row.status === 'requested') {
      requestedQty += qty
    } else if (row.status === 'rejected') {
      hasRejected = true
    }
  }

  const soldQuantity = [...soldByItem.values()].reduce((sum, qty) => sum + qty, 0)
  return {
    refundStatus: aggregateRefundStatus({
      soldQuantity,
      approvedQuantity: approvedQty,
      requestedQuantity: requestedQty,
      hasRejected,
    }),
    refundedAmount: approvedAmount,
    refunds: (refunds ?? []).map((row) => mapRefund(row as Record<string, unknown>, linesByRefund.get(String(row.id)) ?? [])),
    committedByItem,
  }
}

export async function requestShopRefund(input: {
  orderId: string
  actorUserId: string
  body: Record<string, unknown>
  idempotencyKey?: string | null
}): Promise<
  | { httpStatus: number; body: Record<string, unknown> }
  | ServiceFail
> {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 }
  const forbidden = rejectedClientFields(input.body)
  if (forbidden) return forbidden
  if (!parseOptionalUuid(input.orderId)) return { error: 'Invalid order id', httpStatus: 400 }

  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey)
  if (!idempotencyKey) {
    return { error: 'Idempotency key is required for refunds (8–128 chars)', httpStatus: 400 }
  }

  const reason = String(input.body.reason ?? '').trim()
  if (!REFUND_REASON_IDS.includes(reason as (typeof REFUND_REASON_IDS)[number])) {
    return { error: 'A valid refund reason is required', httpStatus: 400 }
  }
  const notes = input.body.notes != null ? String(input.body.notes).trim() : ''
  if (refundReasonRequiresNotes(reason) && !notes) {
    return { error: 'Notes are required for this refund reason', httpStatus: 400 }
  }

  const rawItems = Array.isArray(input.body.items) ? input.body.items : []
  const items = rawItems
    .map((entry) => {
      const row = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {}
      return {
        orderItemId: String(row.orderItemId ?? row.order_item_id ?? ''),
        quantity: Math.floor(Number(row.quantity)),
      }
    })
    .filter((item) => parseOptionalUuid(item.orderItemId) && item.quantity >= 1)

  if (!items.length) return { error: 'Select at least one refundable item', httpStatus: 400 }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, channel, status, payment_status, payment_method, stock_state, total_amount')
    .eq('id', input.orderId)
    .maybeSingle()

  if (orderError) return { error: 'Failed to load sale', httpStatus: 500 }
  if (!order) return { error: 'Sale not found', httpStatus: 404 }
  if (String(order.channel ?? '') === 'online') {
    return { error: 'Online orders cannot be refunded here', httpStatus: 409 }
  }
  if (
    !isPosRefundEligibleOrder({
      channel: order.channel,
      paymentStatus: order.payment_status,
      stockState: order.stock_state,
      status: order.status,
    })
  ) {
    return { error: 'This sale cannot be refunded', httpStatus: 409 }
  }

  const { data: orderItems, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('id, product_id, product_name, quantity, unit_price, line_total')
    .eq('order_id', input.orderId)

  if (itemsError || !orderItems?.length) return { error: 'Sale items could not be loaded', httpStatus: 500 }

  const soldByItem = new Map(orderItems.map((line) => [String(line.id), Number(line.quantity ?? 0)]))
  const view = await loadOrderRefundView(input.orderId, soldByItem)
  if (view.refundStatus === 'full') {
    return { error: 'This sale is already fully refunded', httpStatus: 409 }
  }

  const builtLines: Array<{
    order_item_id: string
    product_id: string
    product_name: string
    quantity: number
    unit_price: number
    line_total: number
  }> = []
  let amount = 0

  for (const item of items) {
    const original = orderItems.find((line) => String(line.id) === item.orderItemId)
    if (!original) return { error: 'Refund line does not belong to this sale', httpStatus: 400 }
    const remaining = refundableQuantity(
      Number(original.quantity ?? 0),
      view.committedByItem.get(item.orderItemId) ?? 0
    )
    if (item.quantity > remaining) {
      return { error: 'Refund quantity is not available', httpStatus: 409 }
    }
    const unitPrice = Number(original.unit_price ?? 0)
    const lineTotal = refundLineAmount(unitPrice, item.quantity)
    amount += lineTotal
    builtLines.push({
      order_item_id: item.orderItemId,
      product_id: String(original.product_id),
      product_name: String(original.product_name ?? ''),
      quantity: item.quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
    })
  }

  const fingerprint = fingerprintRequest(
    refundRequestFingerprint({
      orderId: input.orderId,
      items,
      reason,
      notes,
    })
  )
  const scope = 'shop_refund_request'
  const gate = await beginIdempotentRequest({
    scope,
    idempotencyKey,
    actorUserId: input.actorUserId,
    requestFingerprint: fingerprint,
  })
  if (gate.kind === 'replay') {
    return {
      httpStatus: gate.record.responseStatus,
      body: gate.record.responseBody as Record<string, unknown>,
    }
  }
  if (gate.kind === 'conflict') {
    return { error: 'Conflicting refund request', httpStatus: 409 }
  }
  if (gate.kind === 'error') {
    const safe = toSafeCommerceClientError(gate.error, 500)
    return { error: safe.error, httpStatus: safe.httpStatus }
  }

  const now = new Date().toISOString()
  const { data: refund, error: insertError } = await supabaseAdmin
    .from('shop_refunds')
    .insert([
      {
        order_id: input.orderId,
        status: 'requested',
        reason,
        notes: notes || null,
        payment_method: String(order.payment_method ?? 'cash'),
        amount,
        requested_by: input.actorUserId,
        requested_at: now,
        idempotency_key: idempotencyKey,
      },
    ])
    .select()
    .single()

  if (insertError || !refund) {
    await failIdempotentRequest({ scope, idempotencyKey, errorMessage: insertError?.message || 'insert' })
    if (/duplicate|unique/i.test(insertError?.message || '')) {
      return { error: 'Conflicting refund request', httpStatus: 409 }
    }
    const safe = toSafeCommerceClientError(insertError?.message, 500)
    return { error: safe.error, httpStatus: safe.httpStatus }
  }

  const { error: lineError } = await supabaseAdmin.from('shop_refund_lines').insert(
    builtLines.map((line) => ({ ...line, refund_id: refund.id }))
  )
  if (lineError) {
    await supabaseAdmin.from('shop_refunds').delete().eq('id', refund.id)
    await failIdempotentRequest({ scope, idempotencyKey, errorMessage: lineError.message })
    const safe = toSafeCommerceClientError(lineError.message, 500)
    return { error: safe.error, httpStatus: safe.httpStatus }
  }

  const body = {
    success: true,
    refund: mapRefund(refund as Record<string, unknown>, builtLines.map((line) => ({
      ...line,
      id: '',
      refund_id: String(refund.id),
    }))),
  }
  await completeIdempotentRequest({
    scope,
    idempotencyKey,
    responseStatus: 200,
    responseBody: body,
  })
  return { httpStatus: 200, body }
}

export async function decideShopRefund(input: {
  refundId: string
  actorUserId: string
  body: Record<string, unknown>
  idempotencyKey?: string | null
}): Promise<{ httpStatus: number; body: Record<string, unknown> } | ServiceFail> {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 }
  const forbidden = rejectedClientFields(input.body)
  if (forbidden) return forbidden
  if (!parseOptionalUuid(input.refundId)) return { error: 'Invalid refund id', httpStatus: 400 }

  const decision = String(input.body.decision ?? '').trim()
  if (decision !== 'approve' && decision !== 'reject') {
    return { error: 'Refund decision must be approve or reject', httpStatus: 400 }
  }

  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey)
  if (!idempotencyKey) {
    return { error: 'Idempotency key is required for refunds (8–128 chars)', httpStatus: 400 }
  }

  const { data: refund, error } = await supabaseAdmin
    .from('shop_refunds')
    .select('*')
    .eq('id', input.refundId)
    .maybeSingle()

  if (error) return { error: 'Failed to load refund', httpStatus: 500 }
  if (!refund) return { error: 'Refund not found', httpStatus: 404 }

  if (refund.status === 'approved' && decision === 'approve') {
    return { httpStatus: 200, body: { success: true, replay: true, refund: mapRefund(refund) } }
  }
  if (refund.status === 'rejected' && decision === 'reject') {
    return { httpStatus: 200, body: { success: true, replay: true, refund: mapRefund(refund) } }
  }
  if (refund.status !== 'requested') {
    return { error: 'Refund already processed', httpStatus: 409 }
  }

  const fingerprint = fingerprintRequest({
    refundId: input.refundId,
    decision,
    notes: String(input.body.notes ?? '').trim(),
  })
  const scope = `shop_refund_decision:${input.refundId}`
  const gate = await beginIdempotentRequest({
    scope,
    idempotencyKey,
    actorUserId: input.actorUserId,
    requestFingerprint: fingerprint,
  })
  if (gate.kind === 'replay') {
    return {
      httpStatus: gate.record.responseStatus,
      body: gate.record.responseBody as Record<string, unknown>,
    }
  }
  if (gate.kind === 'conflict') {
    return { error: 'Conflicting refund request', httpStatus: 409 }
  }
  if (gate.kind === 'error') {
    const safe = toSafeCommerceClientError(gate.error, 500)
    return { error: safe.error, httpStatus: safe.httpStatus }
  }

  const lockScope = `shop_refund_decision_lock:${input.refundId}`
  const lockKey = 'decision-lock'
  const lock = await beginIdempotentRequest({
    scope: lockScope,
    idempotencyKey: lockKey,
    actorUserId: input.actorUserId,
    requestFingerprint: fingerprint,
  })
  if (lock.kind === 'replay') {
    const body = lock.record.responseBody as Record<string, unknown>
    await completeIdempotentRequest({
      scope,
      idempotencyKey,
      responseStatus: lock.record.responseStatus,
      responseBody: body,
    })
    return { httpStatus: lock.record.responseStatus, body }
  }
  if (lock.kind === 'conflict') {
    await failIdempotentRequest({ scope, idempotencyKey, errorMessage: lock.error })
    return { error: 'Refund already processed', httpStatus: 409 }
  }
  if (lock.kind === 'error') {
    await failIdempotentRequest({ scope, idempotencyKey, errorMessage: lock.error })
    const safe = toSafeCommerceClientError(lock.error, 500)
    return { error: safe.error, httpStatus: safe.httpStatus }
  }

  const { data: lines, error: lineError } = await supabaseAdmin
    .from('shop_refund_lines')
    .select('*')
    .eq('refund_id', input.refundId)

  if (lineError || !lines?.length) {
    await failIdempotentRequest({ scope, idempotencyKey, errorMessage: 'missing lines' })
    await failIdempotentRequest({ scope: lockScope, idempotencyKey: lockKey, errorMessage: 'missing lines' })
    return { error: 'Refund lines could not be loaded', httpStatus: 500 }
  }

  const stockLines = lines.map((line) => ({
    productId: String(line.product_id),
    quantity: Number(line.quantity),
  }))
  let restored = false

  if (decision === 'approve') {
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('id, quantity, unit_price, product_id')
      .eq('order_id', refund.order_id)
    const soldByItem = new Map((orderItems ?? []).map((line) => [String(line.id), Number(line.quantity ?? 0)]))
    const view = await loadOrderRefundView(String(refund.order_id), soldByItem)
    for (const line of lines) {
      const itemId = String(line.order_item_id)
      const committedExcludingThis = Math.max(
        0,
        (view.committedByItem.get(itemId) ?? 0) - Number(line.quantity ?? 0)
      )
      const remaining = refundableQuantity(soldByItem.get(itemId) ?? 0, committedExcludingThis)
      if (Number(line.quantity) > remaining) {
        await failIdempotentRequest({ scope, idempotencyKey, errorMessage: 'qty' })
        await failIdempotentRequest({ scope: lockScope, idempotencyKey: lockKey, errorMessage: 'qty' })
        return { error: 'Refund quantity is not available', httpStatus: 409 }
      }
      if (Number(line.unit_price) !== Number(orderItems?.find((row) => String(row.id) === itemId)?.unit_price)) {
        await failIdempotentRequest({ scope, idempotencyKey, errorMessage: 'price' })
        await failIdempotentRequest({ scope: lockScope, idempotencyKey: lockKey, errorMessage: 'price' })
        return { error: 'Refund uses the original sale price only', httpStatus: 409 }
      }
    }

    const stock = await restoreStockForReturn({
      lines: stockLines,
      orderId: String(refund.order_id),
      actorUserId: input.actorUserId,
      reason: `Approved POS refund ${refund.reason}`,
      refundId: String(refund.id),
    })
    if (stock.error) {
      await failIdempotentRequest({ scope, idempotencyKey, errorMessage: stock.error })
      await failIdempotentRequest({ scope: lockScope, idempotencyKey: lockKey, errorMessage: stock.error })
      const safe = toSafeCommerceClientError(stock.error, 409)
      return { error: safe.error, httpStatus: safe.httpStatus }
    }
    restored = Boolean(stock.restored)
  }

  const now = new Date().toISOString()
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('shop_refunds')
    .update({
      status: decision === 'approve' ? 'approved' : 'rejected',
      decided_by: input.actorUserId,
      decided_at: now,
      decision_notes: input.body.notes != null ? String(input.body.notes).trim() || null : null,
      updated_at: now,
    })
    .eq('id', input.refundId)
    .eq('status', 'requested')
    .select()
    .maybeSingle()

  if (updateError || !updated) {
    if (restored) {
      await rollbackRestoredReturn({
        lines: stockLines,
        orderId: String(refund.order_id),
        actorUserId: input.actorUserId,
        reason: `Rollback uncommitted POS refund ${refund.id}`,
        refundId: String(refund.id),
      })
    }
    await failIdempotentRequest({
      scope,
      idempotencyKey,
      errorMessage: updateError?.message || 'already processed',
    })
    await failIdempotentRequest({
      scope: lockScope,
      idempotencyKey: lockKey,
      errorMessage: updateError?.message || 'already processed',
    })
    return { error: 'Refund already processed', httpStatus: 409 }
  }

  const body = {
    success: true,
    refund: mapRefund(updated as Record<string, unknown>, lines as RefundLineRow[]),
  }
  await completeIdempotentRequest({
    scope,
    idempotencyKey,
    responseStatus: 200,
    responseBody: body,
  })
  await completeIdempotentRequest({
    scope: lockScope,
    idempotencyKey: lockKey,
    responseStatus: 200,
    responseBody: body,
  })
  return { httpStatus: 200, body }
}
