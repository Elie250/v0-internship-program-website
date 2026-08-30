import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  isInsufficientStockError,
  type StockLine,
  type StockMovementType,
} from '@/lib/shop/stock-types'

type MovementInput = {
  productId: string
  movementType: StockMovementType
  quantityDelta: number
  quantityBefore?: number | null
  quantityAfter?: number | null
  reason?: string | null
  orderId?: string | null
  reservationId?: string | null
  actorUserId?: string | null
  metadata?: Record<string, unknown>
}

async function recordMovement(input: MovementInput): Promise<{ error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { error } = await supabaseAdmin.from('stock_movements').insert([
    {
      product_id: input.productId,
      movement_type: input.movementType,
      quantity_delta: input.quantityDelta,
      quantity_before: input.quantityBefore ?? null,
      quantity_after: input.quantityAfter ?? null,
      reason: input.reason ?? null,
      order_id: input.orderId ?? null,
      reservation_id: input.reservationId ?? null,
      actor_user_id: input.actorUserId ?? null,
      metadata: input.metadata ?? {},
    },
  ])

  if (error) return { error: error.message }
  return {}
}

async function readStock(productId: string): Promise<number | null> {
  if (!supabaseAdmin) return null
  const { data } = await supabaseAdmin
    .from('products')
    .select('stock')
    .eq('id', productId)
    .maybeSingle()
  if (!data) return null
  return Number(data.stock ?? 0)
}

/**
 * Atomically reduce sellable stock. Fails if insufficient quantity.
 * Returns quantity after update.
 */
export async function consumeStockAtomic(
  productId: string,
  quantity: number
): Promise<{ quantityAfter?: number; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  if (!Number.isFinite(quantity) || quantity < 1) return { error: 'Invalid quantity' }

  const before = await readStock(productId)
  const { data, error } = await supabaseAdmin.rpc('shop_consume_stock', {
    p_product_id: productId,
    p_quantity: quantity,
  })

  if (error) {
    if (isInsufficientStockError(error.message)) {
      return { error: 'Insufficient stock' }
    }
    return { error: error.message }
  }

  const quantityAfter = typeof data === 'number' ? data : Number(data)
  return {
    quantityAfter,
    ...(before != null ? {} : {}),
  }
}

export async function releaseStockAtomic(
  productId: string,
  quantity: number
): Promise<{ quantityAfter?: number; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  if (!Number.isFinite(quantity) || quantity < 1) return { error: 'Invalid quantity' }

  const { data, error } = await supabaseAdmin.rpc('shop_release_stock', {
    p_product_id: productId,
    p_quantity: quantity,
  })

  if (error) return { error: error.message }
  return { quantityAfter: typeof data === 'number' ? data : Number(data) }
}

/**
 * Consume stock for many lines (sequential). Rolls back already-consumed lines on failure.
 */
export async function consumeStockForLines(input: {
  lines: StockLine[]
  movementType: 'SALE' | 'RESERVE'
  orderId?: string | null
  actorUserId?: string | null
  reason?: string | null
}): Promise<{ error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const applied: Array<{ productId: string; quantity: number; quantityAfter: number }> = []

  for (const line of input.lines) {
    const before = await readStock(line.productId)
    const result = await consumeStockAtomic(line.productId, line.quantity)
    if (result.error || result.quantityAfter == null) {
      for (const prior of applied.reverse()) {
        await releaseStockAtomic(prior.productId, prior.quantity)
      }
      return { error: result.error || 'Stock update failed' }
    }

    applied.push({
      productId: line.productId,
      quantity: line.quantity,
      quantityAfter: result.quantityAfter,
    })

    const movement = await recordMovement({
      productId: line.productId,
      movementType: input.movementType,
      quantityDelta: -line.quantity,
      quantityBefore: before,
      quantityAfter: result.quantityAfter,
      reason: input.reason,
      orderId: input.orderId,
      actorUserId: input.actorUserId,
    })
    if (movement.error) {
      for (const prior of applied.reverse()) {
        await releaseStockAtomic(prior.productId, prior.quantity)
      }
      return { error: movement.error }
    }
  }

  return {}
}

export async function releaseStockForLines(input: {
  lines: StockLine[]
  orderId?: string | null
  actorUserId?: string | null
  reason?: string | null
}): Promise<{ error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  for (const line of input.lines) {
    const before = await readStock(line.productId)
    const result = await releaseStockAtomic(line.productId, line.quantity)
    if (result.error || result.quantityAfter == null) {
      return { error: result.error || 'Stock release failed' }
    }

    const movement = await recordMovement({
      productId: line.productId,
      movementType: 'RELEASE',
      quantityDelta: line.quantity,
      quantityBefore: before,
      quantityAfter: result.quantityAfter,
      reason: input.reason,
      orderId: input.orderId,
      actorUserId: input.actorUserId,
    })
    if (movement.error) return { error: movement.error }
  }

  return {}
}

async function returnAlreadyRecorded(refundId: string): Promise<boolean> {
  if (!supabaseAdmin) return false
  const { data, error } = await supabaseAdmin
    .from('stock_movements')
    .select('id')
    .eq('movement_type', 'RETURN')
    .contains('metadata', { refundId })
    .limit(1)
  if (error) return false
  return Boolean(data?.length)
}

/**
 * Restore sellable stock for an approved physical refund.
 * Rolls back already-restored lines if a later line or movement insert fails.
 * Does not rewrite the original sale. Repeats with the same refundId are no-ops.
 */
export async function restoreStockForReturn(input: {
  lines: StockLine[]
  orderId?: string | null
  actorUserId?: string | null
  reason?: string | null
  refundId?: string | null
}): Promise<{ error?: string; restored?: boolean }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  if (input.refundId && (await returnAlreadyRecorded(input.refundId))) {
    return { restored: false }
  }

  const applied: Array<{ productId: string; quantity: number }> = []

  for (const line of input.lines) {
    const before = await readStock(line.productId)
    const result = await releaseStockAtomic(line.productId, line.quantity)
    if (result.error || result.quantityAfter == null) {
      for (const prior of applied.reverse()) {
        await consumeStockAtomic(prior.productId, prior.quantity)
      }
      return { error: result.error || 'Stock restore failed' }
    }

    applied.push({ productId: line.productId, quantity: line.quantity })

    const movement = await recordMovement({
      productId: line.productId,
      movementType: 'RETURN',
      quantityDelta: line.quantity,
      quantityBefore: before,
      quantityAfter: result.quantityAfter,
      reason: input.reason,
      orderId: input.orderId,
      actorUserId: input.actorUserId,
      metadata: input.refundId ? { refundId: input.refundId } : {},
    })
    if (movement.error) {
      for (const prior of applied.reverse()) {
        await consumeStockAtomic(prior.productId, prior.quantity)
      }
      return { error: movement.error }
    }
  }

  return { restored: true }
}

/**
 * Undo a stock restore when refund approval cannot be committed.
 * Only call this for restorations performed in the same attempt.
 */
export async function rollbackRestoredReturn(input: {
  lines: StockLine[]
  orderId?: string | null
  actorUserId?: string | null
  reason?: string | null
  refundId?: string | null
}): Promise<{ error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const applied: Array<{ productId: string; quantity: number }> = []

  for (const line of input.lines) {
    const before = await readStock(line.productId)
    const result = await consumeStockAtomic(line.productId, line.quantity)
    if (result.error || result.quantityAfter == null) {
      for (const prior of applied.reverse()) {
        await releaseStockAtomic(prior.productId, prior.quantity)
      }
      return { error: result.error || 'Stock rollback failed' }
    }

    applied.push({ productId: line.productId, quantity: line.quantity })

    const movement = await recordMovement({
      productId: line.productId,
      movementType: 'ADJUSTMENT',
      quantityDelta: -line.quantity,
      quantityBefore: before,
      quantityAfter: result.quantityAfter,
      reason: input.reason,
      orderId: input.orderId,
      actorUserId: input.actorUserId,
      metadata: input.refundId ? { refundId: input.refundId, rollback: true } : {},
    })
    if (movement.error) {
      for (const prior of applied.reverse()) {
        await releaseStockAtomic(prior.productId, prior.quantity)
      }
      return { error: movement.error }
    }
  }

  return {}
}

export async function createActiveReservations(input: {
  orderId: string
  lines: StockLine[]
}): Promise<{ error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { error } = await supabaseAdmin.from('stock_reservations').insert(
    input.lines.map((line) => ({
      order_id: input.orderId,
      product_id: line.productId,
      quantity: line.quantity,
      status: 'active',
    }))
  )

  if (error) return { error: error.message }
  return {}
}

export async function convertReservationsForOrder(
  orderId: string,
  actorUserId?: string | null
): Promise<{ error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { data: reservations, error } = await supabaseAdmin
    .from('stock_reservations')
    .select('id, product_id, quantity, status')
    .eq('order_id', orderId)
    .eq('status', 'active')

  if (error) return { error: error.message }
  if (!reservations?.length) return {}

  const now = new Date().toISOString()
  for (const row of reservations) {
    const { error: updateError } = await supabaseAdmin
      .from('stock_reservations')
      .update({ status: 'converted', converted_at: now, updated_at: now })
      .eq('id', row.id)
      .eq('status', 'active')

    if (updateError) return { error: updateError.message }

    const after = await readStock(row.product_id)
    await recordMovement({
      productId: row.product_id,
      movementType: 'SALE',
      quantityDelta: 0,
      quantityBefore: after,
      quantityAfter: after,
      reason: 'MoMo payment approved — reservation converted to sale',
      orderId,
      reservationId: row.id,
      actorUserId,
      metadata: { reserved_quantity: row.quantity },
    })
  }

  await supabaseAdmin
    .from('orders')
    .update({ stock_state: 'consumed', updated_at: now })
    .eq('id', orderId)

  return {}
}

export async function releaseReservationsForOrder(
  orderId: string,
  actorUserId?: string | null,
  reason?: string
): Promise<{ error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const { data: reservations, error } = await supabaseAdmin
    .from('stock_reservations')
    .select('id, product_id, quantity, status')
    .eq('order_id', orderId)
    .eq('status', 'active')

  if (error) return { error: error.message }
  if (!reservations?.length) return {}

  const now = new Date().toISOString()
  const lines = reservations.map((row) => ({
    productId: row.product_id as string,
    quantity: Number(row.quantity),
  }))

  const release = await releaseStockForLines({
    lines,
    orderId,
    actorUserId,
    reason: reason || 'Reservation released',
  })
  if (release.error) return release

  for (const row of reservations) {
    await supabaseAdmin
      .from('stock_reservations')
      .update({ status: 'released', released_at: now, updated_at: now })
      .eq('id', row.id)
      .eq('status', 'active')
  }

  await supabaseAdmin
    .from('orders')
    .update({ stock_state: 'released', updated_at: now })
    .eq('id', orderId)

  return {}
}

export async function adjustStockAbsolute(input: {
  productId: string
  newStock: number
  actorUserId?: string | null
  reason?: string | null
}): Promise<{ error?: string; quantityBefore?: number; quantityAfter?: number }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  if (!Number.isFinite(input.newStock) || input.newStock < 0) {
    return { error: 'Invalid stock' }
  }

  const { data, error } = await supabaseAdmin.rpc('shop_set_stock', {
    p_product_id: input.productId,
    p_new_stock: input.newStock,
  })

  if (error) return { error: error.message }

  const row = Array.isArray(data) ? data[0] : data
  const quantityBefore = Number(row?.quantity_before ?? 0)
  const quantityAfter = Number(row?.quantity_after ?? input.newStock)
  const delta = quantityAfter - quantityBefore

  const movement = await recordMovement({
    productId: input.productId,
    movementType: 'ADJUSTMENT',
    quantityDelta: delta,
    quantityBefore,
    quantityAfter,
    reason: input.reason ?? 'Manual stock adjustment',
    actorUserId: input.actorUserId,
  })
  if (movement.error) return { error: movement.error }

  return { quantityBefore, quantityAfter }
}

export async function adjustStockDelta(input: {
  productId: string
  quantityDelta: number
  movementType: StockMovementType
  actorUserId?: string | null
  reason?: string | null
}): Promise<{ error?: string; quantityBefore?: number; quantityAfter?: number }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  if (!Number.isFinite(input.quantityDelta) || input.quantityDelta === 0) {
    return { error: 'Quantity change is required' }
  }

  const { data, error } = await supabaseAdmin.rpc('shop_add_stock', {
    p_product_id: input.productId,
    p_delta: Math.trunc(input.quantityDelta),
  })

  if (error) {
    if (isInsufficientStockError(error.message)) {
      return { error: 'Insufficient stock' }
    }
    return { error: error.message }
  }

  const row = Array.isArray(data) ? data[0] : data
  const quantityBefore = Number(row?.quantity_before ?? 0)
  const quantityAfter = Number(row?.quantity_after ?? quantityBefore + input.quantityDelta)

  const movement = await recordMovement({
    productId: input.productId,
    movementType: input.movementType,
    quantityDelta: quantityAfter - quantityBefore,
    quantityBefore,
    quantityAfter,
    reason: input.reason ?? 'Stock change',
    actorUserId: input.actorUserId,
  })
  if (movement.error) return { error: movement.error }

  return { quantityBefore, quantityAfter }
}
