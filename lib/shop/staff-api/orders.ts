import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  kigaliDateFilterBounds,
  paginatedResponse,
  parseOptionalDate,
  parseOptionalUuid,
  parsePagination,
} from '@/lib/shop/staff-api/common'

function mapOrderSummary(row: Record<string, unknown>, locationName: string | null) {
  return {
    id: String(row.id),
    orderNumber: row.order_number != null ? String(row.order_number) : null,
    channel: row.channel != null ? String(row.channel) : null,
    status: row.status != null ? String(row.status) : null,
    paymentStatus: row.payment_status != null ? String(row.payment_status) : null,
    paymentMethod: row.payment_method != null ? String(row.payment_method) : null,
    totalAmount: Number(row.total_amount ?? 0),
    customerName: row.customer_name != null ? String(row.customer_name) : null,
    fulfillmentType: row.fulfillment_type != null ? String(row.fulfillment_type) : null,
    locationId: row.location_id != null ? String(row.location_id) : null,
    locationName,
    createdBy: row.created_by != null ? String(row.created_by) : null,
    orderDate: row.order_date != null ? String(row.order_date) : null,
    createdAt: row.created_at != null ? String(row.created_at) : null,
    paidAt: row.paid_at != null ? String(row.paid_at) : null,
  }
}

export async function listStaffOrders(searchParams: URLSearchParams) {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 as const }

  const { page, limit, offset } = parsePagination(searchParams)
  const channel = searchParams.get('channel')?.trim() || ''
  const status = searchParams.get('status')?.trim() || ''
  const paymentStatus = searchParams.get('payment_status')?.trim() || ''
  const dateFrom = parseOptionalDate(searchParams.get('date_from'))
  const dateTo = parseOptionalDate(searchParams.get('date_to'))
  if (searchParams.get('date_from') && !dateFrom) {
    return { error: 'Invalid date_from', httpStatus: 400 as const }
  }
  if (searchParams.get('date_to') && !dateTo) {
    return { error: 'Invalid date_to', httpStatus: 400 as const }
  }
  if (channel && !['pos', 'online'].includes(channel)) {
    return { error: 'Invalid channel', httpStatus: 400 as const }
  }

  let query = supabaseAdmin
    .from('orders')
    .select(
      'id, order_number, channel, status, payment_status, payment_method, total_amount, customer_name, fulfillment_type, location_id, created_by, order_date, created_at, paid_at',
      { count: 'exact' }
    )

  if (channel) query = query.eq('channel', channel)
  if (status) query = query.eq('status', status)
  if (paymentStatus) query = query.eq('payment_status', paymentStatus)
  const { startIso, endIso } = kigaliDateFilterBounds(dateFrom, dateTo)
  if (startIso) query = query.gte('order_date', startIso)
  if (endIso) query = query.lte('order_date', endIso)

  const { data, error, count } = await query
    .order('order_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    if (/location_id/i.test(error.message)) {
      return listStaffOrdersWithoutLocation(searchParams)
    }
    return { error: 'Failed to load orders', httpStatus: 500 as const }
  }

  const locationIds = [
    ...new Set(
      (data ?? [])
        .map((row) => row.location_id)
        .filter(Boolean)
        .map(String)
    ),
  ]
  const locationNames = await loadLocationNames(locationIds)

  return {
    httpStatus: 200 as const,
    body: paginatedResponse({
      items: (data ?? []).map((row) =>
        mapOrderSummary(
          row as Record<string, unknown>,
          row.location_id ? locationNames.get(String(row.location_id)) ?? null : null
        )
      ),
      page,
      limit,
      total: count ?? 0,
    }),
  }
}

async function listStaffOrdersWithoutLocation(searchParams: URLSearchParams) {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 as const }
  const { page, limit, offset } = parsePagination(searchParams)
  const channel = searchParams.get('channel')?.trim() || ''
  const status = searchParams.get('status')?.trim() || ''
  const paymentStatus = searchParams.get('payment_status')?.trim() || ''

  let query = supabaseAdmin
    .from('orders')
    .select(
      'id, order_number, channel, status, payment_status, payment_method, total_amount, customer_name, fulfillment_type, created_by, order_date, created_at, paid_at',
      { count: 'exact' }
    )
  if (channel) query = query.eq('channel', channel)
  if (status) query = query.eq('status', status)
  if (paymentStatus) query = query.eq('payment_status', paymentStatus)

  const { data, error, count } = await query
    .order('order_date', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) return { error: 'Failed to load orders', httpStatus: 500 as const }

  return {
    httpStatus: 200 as const,
    body: paginatedResponse({
      items: (data ?? []).map((row) =>
        mapOrderSummary({ ...(row as object), location_id: null }, null)
      ),
      page,
      limit,
      total: count ?? 0,
    }),
  }
}

async function loadLocationNames(ids: string[]) {
  const map = new Map<string, string>()
  if (!supabaseAdmin || !ids.length) return map
  const { data } = await supabaseAdmin.from('shop_locations').select('id, name').in('id', ids)
  for (const row of data ?? []) {
    map.set(String(row.id), String(row.name))
  }
  return map
}

export async function getStaffOrderById(id: string) {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 as const }
  if (!parseOptionalUuid(id)) return { error: 'Invalid order id', httpStatus: 400 as const }

  let { data: order, error } = await supabaseAdmin
    .from('orders')
    .select(
      'id, order_number, channel, status, payment_status, payment_method, total_amount, customer_name, fulfillment_type, delivery_address, notes, location_id, created_by, order_date, created_at, paid_at, payment_id, stock_state'
    )
    .eq('id', id)
    .maybeSingle()

  if (error && /location_id|stock_state/i.test(error.message)) {
    const fallback = await supabaseAdmin
      .from('orders')
      .select(
        'id, order_number, channel, status, payment_status, payment_method, total_amount, customer_name, fulfillment_type, delivery_address, notes, created_by, order_date, created_at, paid_at, payment_id'
      )
      .eq('id', id)
      .maybeSingle()
    order = fallback.data
      ? ({ ...fallback.data, location_id: null, stock_state: null } as typeof order)
      : null
    error = fallback.error
  }

  if (error) return { error: 'Failed to load order', httpStatus: 500 as const }
  if (!order) return { error: 'Order not found', httpStatus: 404 as const }

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('id, product_id, product_name, quantity, unit_price, unit_cost, line_total')
    .eq('order_id', id)

  let payment: Record<string, unknown> | null = null
  if (order.payment_id) {
    const { data } = await supabaseAdmin
      .from('payments')
      .select('id, amount, status, payment_method, created_at, paid_at, order_id')
      .eq('id', order.payment_id)
      .maybeSingle()
    payment = (data as Record<string, unknown>) ?? null
  }
  if (!payment) {
    const { data } = await supabaseAdmin
      .from('payments')
      .select('id, amount, status, payment_method, created_at, paid_at, order_id')
      .eq('order_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    payment = (data as Record<string, unknown>) ?? null
  }

  let locationName: string | null = null
  if (order.location_id) {
    const names = await loadLocationNames([String(order.location_id)])
    locationName = names.get(String(order.location_id)) ?? null
  }

  return {
    httpStatus: 200 as const,
    body: {
      item: {
        ...mapOrderSummary(order as Record<string, unknown>, locationName),
        notes: order.notes != null ? String(order.notes) : null,
        deliveryAddress:
          order.delivery_address != null ? String(order.delivery_address) : null,
        stockState: order.stock_state != null ? String(order.stock_state) : null,
        items: (items ?? []).map((line) => ({
          id: String(line.id),
          productId: line.product_id != null ? String(line.product_id) : null,
          productName: String(line.product_name ?? ''),
          quantity: Number(line.quantity ?? 0),
          unitPrice: Number(line.unit_price ?? 0),
          unitCost: Number(line.unit_cost ?? 0),
          lineTotal: Number(line.line_total ?? 0),
        })),
        payment: payment
          ? {
              id: String(payment.id),
              amount: Number(payment.amount ?? 0),
              status: String(payment.status ?? ''),
              paymentMethod:
                payment.payment_method != null ? String(payment.payment_method) : null,
              createdAt: payment.created_at != null ? String(payment.created_at) : null,
              paidAt: payment.paid_at != null ? String(payment.paid_at) : null,
            }
          : null,
      },
    },
  }
}
