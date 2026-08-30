import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  kigaliDateFilterBounds,
  paginatedResponse,
  parseOptionalDate,
  parseOptionalUuid,
  parsePagination,
  sanitizeSearchTerm,
} from '@/lib/shop/staff-api/common'
import { STOCK_MOVEMENT_TYPES } from '@/lib/shop/stock-types'
import { adjustStockDelta } from '@/lib/shop/stock-ops'

export async function listStaffInventory(searchParams: URLSearchParams) {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 as const }

  const { page, limit, offset } = parsePagination(searchParams)
  const q = sanitizeSearchTerm(searchParams.get('q') || '')
  const status = searchParams.get('status')?.trim() || ''

  let query = supabaseAdmin
    .from('products')
    .select(
      'id, name, sku, barcode, stock, low_stock_threshold, target_stock, status, price, updated_at',
      { count: 'exact' }
    )

  if (status && status !== 'all') query = query.eq('status', status)
  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`)

  const { data, error, count } = await query
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    if (/target_stock|barcode/i.test(error.message)) {
      const fallback = await supabaseAdmin
        .from('products')
        .select('id, name, sku, stock, low_stock_threshold, status, price, updated_at', {
          count: 'exact',
        })
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1)
      if (fallback.error) return { error: 'Failed to load inventory', httpStatus: 500 as const }
      return {
        httpStatus: 200 as const,
        body: paginatedResponse({
          items: (fallback.data ?? []).map((row) => mapInventoryRow(row as Record<string, unknown>)),
          page,
          limit,
          total: fallback.count ?? 0,
        }),
      }
    }
    return { error: 'Failed to load inventory', httpStatus: 500 as const }
  }

  return {
    httpStatus: 200 as const,
    body: paginatedResponse({
      items: (data ?? []).map((row) => mapInventoryRow(row as Record<string, unknown>)),
      page,
      limit,
      total: count ?? 0,
    }),
  }
}

function mapInventoryRow(
  row: Record<string, unknown>,
  onOrder = 0
) {
  const stock = Number(row.stock ?? 0)
  const threshold =
    row.low_stock_threshold != null ? Number(row.low_stock_threshold) : 5
  const targetStock =
    row.target_stock != null && Number.isFinite(Number(row.target_stock))
      ? Number(row.target_stock)
      : null
  const suggestedPurchase =
    targetStock != null ? Math.max(0, targetStock - stock - onOrder) : 0
  return {
    productId: String(row.id),
    name: String(row.name ?? ''),
    sku: row.sku != null ? String(row.sku) : null,
    barcode: row.barcode != null ? String(row.barcode) : null,
    currentStock: stock,
    lowStockThreshold: threshold,
    targetStock,
    onOrder,
    suggestedPurchase,
    isLowStock: stock <= threshold,
    status: row.status != null ? String(row.status) : null,
    price: Number(row.price ?? 0),
    updatedAt: row.updated_at != null ? String(row.updated_at) : null,
    /** Explicit: inventory is global products.stock, not per-location. */
    stockModel: 'global_products_stock' as const,
  }
}

export async function listStaffStockMovements(searchParams: URLSearchParams) {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 as const }

  const { page, limit, offset } = parsePagination(searchParams)
  const productId = parseOptionalUuid(searchParams.get('product_id'))
  if (searchParams.get('product_id') && !productId) {
    return { error: 'Invalid product_id', httpStatus: 400 as const }
  }

  const movementType = searchParams.get('movement_type')?.trim() || ''
  if (
    movementType &&
    !STOCK_MOVEMENT_TYPES.includes(movementType as (typeof STOCK_MOVEMENT_TYPES)[number])
  ) {
    return { error: 'Invalid movement_type', httpStatus: 400 as const }
  }

  const dateFrom = parseOptionalDate(searchParams.get('date_from'))
  const dateTo = parseOptionalDate(searchParams.get('date_to'))
  if (searchParams.get('date_from') && !dateFrom) {
    return { error: 'Invalid date_from', httpStatus: 400 as const }
  }
  if (searchParams.get('date_to') && !dateTo) {
    return { error: 'Invalid date_to', httpStatus: 400 as const }
  }

  let query = supabaseAdmin
    .from('stock_movements')
    .select(
      'id, product_id, movement_type, quantity_delta, quantity_before, quantity_after, reason, order_id, actor_user_id, created_at, metadata',
      { count: 'exact' }
    )

  if (productId) query = query.eq('product_id', productId)
  if (movementType) query = query.eq('movement_type', movementType)
  const { startIso, endIso } = kigaliDateFilterBounds(dateFrom, dateTo)
  if (startIso) query = query.gte('created_at', startIso)
  if (endIso) query = query.lte('created_at', endIso)

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    if (/stock_movements|does not exist|schema cache/i.test(error.message)) {
      return {
        error: 'Stock movements are unavailable until commerce foundation migration is applied',
        httpStatus: 503 as const,
      }
    }
    return { error: 'Failed to load stock movements', httpStatus: 500 as const }
  }

  return {
    httpStatus: 200 as const,
    body: paginatedResponse({
      items: (data ?? []).map((row) => ({
        id: String(row.id),
        productId: String(row.product_id),
        movementType: String(row.movement_type),
        quantityDelta: Number(row.quantity_delta ?? 0),
        quantityBefore: row.quantity_before != null ? Number(row.quantity_before) : null,
        quantityAfter: row.quantity_after != null ? Number(row.quantity_after) : null,
        reason: row.reason != null ? String(row.reason) : null,
        orderId: row.order_id != null ? String(row.order_id) : null,
        actorUserId: row.actor_user_id != null ? String(row.actor_user_id) : null,
        createdAt: String(row.created_at),
        metadata: row.metadata ?? {},
      })),
      page,
      limit,
      total: count ?? 0,
    }),
  }
}

async function loadOnOrderByProduct(productIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (!supabaseAdmin || productIds.length === 0) return map
  const { data, error } = await supabaseAdmin
    .from('shop_purchase_requests')
    .select('product_id, quantity')
    .eq('status', 'open')
    .in('product_id', productIds)
  if (error || !data) return map
  for (const row of data) {
    const id = String(row.product_id)
    map.set(id, (map.get(id) ?? 0) + Number(row.quantity ?? 0))
  }
  return map
}

export async function mutateStaffStock(input: {
  productId: string
  quantityDelta: number
  reason: string
  actorUserId: string
  operation: 'adjust' | 'receive'
}) {
  if (!parseOptionalUuid(input.productId)) {
    return { error: 'Invalid product id', httpStatus: 400 as const }
  }
  const reason = input.reason.trim()
  if (!reason) return { error: 'Reason is required', httpStatus: 400 as const }
  if (!Number.isFinite(input.quantityDelta) || input.quantityDelta === 0) {
    return { error: 'Quantity change is required', httpStatus: 400 as const }
  }
  if (input.operation === 'receive' && input.quantityDelta < 1) {
    return { error: 'Receive quantity must be at least 1', httpStatus: 400 as const }
  }

  const result = await adjustStockDelta({
    productId: input.productId,
    quantityDelta: Math.trunc(input.quantityDelta),
    movementType: input.operation === 'receive' ? 'PURCHASE' : 'ADJUSTMENT',
    actorUserId: input.actorUserId,
    reason,
  })
  if (result.error) {
    const status = /insufficient/i.test(result.error) ? 409 : 400
    return { error: result.error, httpStatus: status as 400 | 409 }
  }
  return {
    httpStatus: 200 as const,
    body: {
      productId: input.productId,
      operation: input.operation,
      quantityDelta: result.quantityAfter! - result.quantityBefore!,
      quantityBefore: result.quantityBefore,
      quantityAfter: result.quantityAfter,
      reason,
    },
  }
}

export async function listStaffReplenishment(searchParams: URLSearchParams) {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 as const }

  const { page, limit, offset } = parsePagination(searchParams)
  const q = sanitizeSearchTerm(searchParams.get('q') || '')
  let query = supabaseAdmin
    .from('products')
    .select(
      'id, name, sku, stock, low_stock_threshold, target_stock, status, updated_at',
      { count: 'exact' }
    )
    .neq('status', 'archived')

  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`)

  const { data, error, count } = await query
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    if (/target_stock/i.test(error.message)) {
      return {
        error: 'Replenishment is unavailable until target_stock migration is applied',
        httpStatus: 503 as const,
      }
    }
    return { error: 'Failed to load replenishment', httpStatus: 500 as const }
  }

  const rows = data ?? []
  const onOrder = await loadOnOrderByProduct(rows.map((row) => String(row.id)))
  const items = rows
    .map((row) => mapInventoryRow(row as Record<string, unknown>, onOrder.get(String(row.id)) ?? 0))
    .filter((row) => row.isLowStock)

  return {
    httpStatus: 200 as const,
    body: paginatedResponse({
      items,
      page,
      limit,
      total: count ?? items.length,
    }),
  }
}

export async function createStaffPurchaseRequest(input: {
  productId: string
  quantity: number
  notes?: string | null
  actorUserId: string
}) {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 as const }
  if (!parseOptionalUuid(input.productId)) {
    return { error: 'Invalid product id', httpStatus: 400 as const }
  }
  if (!Number.isFinite(input.quantity) || input.quantity < 1) {
    return { error: 'Quantity must be at least 1', httpStatus: 400 as const }
  }

  const { data, error } = await supabaseAdmin
    .from('shop_purchase_requests')
    .insert([
      {
        product_id: input.productId,
        quantity: Math.trunc(input.quantity),
        status: 'open',
        notes: input.notes?.trim() || null,
        requested_by: input.actorUserId,
      },
    ])
    .select('id, product_id, quantity, status, notes, requested_by, created_at')
    .single()

  if (error) {
    if (/shop_purchase_requests|does not exist|schema cache/i.test(error.message)) {
      return {
        error: 'Purchase requests are unavailable until the inventory migration is applied',
        httpStatus: 503 as const,
      }
    }
    return { error: 'Failed to create purchase request', httpStatus: 400 as const }
  }

  return {
    httpStatus: 201 as const,
    body: {
      item: {
        id: String(data.id),
        productId: String(data.product_id),
        quantity: Number(data.quantity),
        status: String(data.status),
        notes: data.notes != null ? String(data.notes) : null,
        requestedBy: data.requested_by != null ? String(data.requested_by) : null,
        createdAt: String(data.created_at),
      },
    },
  }
}
