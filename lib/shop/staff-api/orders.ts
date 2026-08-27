import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { formatSellingUnit } from '@/lib/shop/selling-unit'
import {
  kigaliDateFilterBounds,
  paginatedResponse,
  parseOptionalDate,
  parseOptionalUuid,
  parsePagination,
} from '@/lib/shop/staff-api/common'

export const STAFF_FULFILLMENT_STATUSES = [
  'confirmed',
  'ready_for_pickup',
  'out_for_delivery',
  'completed',
] as const

export type StaffFulfillmentStatus = (typeof STAFF_FULFILLMENT_STATUSES)[number]

const PAYMENT_SELECTS = [
  'id, amount, status, payment_method, receipt_url, receipt_number, admin_notes, reviewed_by, reviewed_at, created_at, paid_at, order_id',
  'id, amount, status, payment_method, receipt_url, receipt_number, created_at, paid_at, order_id',
  'id, amount, status, payment_method, created_at, paid_at, order_id',
] as const

function isMissingColumnError(message: string | undefined): boolean {
  if (!message) return false
  return /does not exist|could not find|column/i.test(message)
}

function mapOrderSummary(
  row: Record<string, unknown>,
  locationName: string | null,
  payment?: ReturnType<typeof mapStaffPayment> | null
) {
  return {
    id: String(row.id),
    orderNumber: row.order_number != null ? String(row.order_number) : null,
    channel: row.channel != null ? String(row.channel) : null,
    status: row.status != null ? String(row.status) : null,
    paymentStatus: row.payment_status != null ? String(row.payment_status) : null,
    paymentMethod: row.payment_method != null ? String(row.payment_method) : null,
    totalAmount: Number(row.total_amount ?? 0),
    customerName: row.customer_name != null ? String(row.customer_name) : null,
    customerPhone: row.customer_phone != null ? String(row.customer_phone) : null,
    customerEmail: row.customer_email != null ? String(row.customer_email) : null,
    fulfillmentType: row.fulfillment_type != null ? String(row.fulfillment_type) : null,
    locationId: row.location_id != null ? String(row.location_id) : null,
    locationName,
    orderDate: row.order_date != null ? String(row.order_date) : null,
    createdAt: row.created_at != null ? String(row.created_at) : null,
    paidAt: row.paid_at != null ? String(row.paid_at) : null,
    payment: payment ?? null,
  }
}

function mapStaffPayment(
  payment: Record<string, unknown>,
  reviewerName: string | null
) {
  return {
    amount: Number(payment.amount ?? 0),
    status: String(payment.status ?? ''),
    paymentMethod: payment.payment_method != null ? String(payment.payment_method) : null,
    proofUrl: payment.receipt_url != null ? String(payment.receipt_url) : null,
    referenceNumber: payment.receipt_number != null ? String(payment.receipt_number) : null,
    notes: payment.admin_notes != null ? String(payment.admin_notes) : null,
    submittedAt: payment.created_at != null ? String(payment.created_at) : null,
    createdAt: payment.created_at != null ? String(payment.created_at) : null,
    reviewedAt: payment.reviewed_at != null ? String(payment.reviewed_at) : null,
    reviewedBy: reviewerName,
    paidAt: payment.paid_at != null ? String(payment.paid_at) : null,
  }
}

async function loadPaymentRow(options: {
  paymentId?: string | null
  orderId: string
}): Promise<Record<string, unknown> | null> {
  const db = supabaseAdmin
  if (!db) return null

  const trySelects = async (column: 'id' | 'order_id', value: string) => {
    for (const columns of PAYMENT_SELECTS) {
      let query = db.from('payments').select(columns).eq(column, value)
      if (column === 'order_id') {
        query = query.order('created_at', { ascending: false }).limit(1)
      }
      const result = await query.maybeSingle()
      if (!result.error && result.data) {
        return result.data as unknown as Record<string, unknown>
      }
      if (result.error && !isMissingColumnError(result.error.message)) {
        return null
      }
    }
    return null
  }

  if (options.paymentId) {
    const byId = await trySelects('id', options.paymentId)
    if (byId) return byId
  }
  return trySelects('order_id', options.orderId)
}

async function loadPaymentsForOrders(
  orders: Array<Record<string, unknown>>
): Promise<Map<string, Record<string, unknown>>> {
  const map = new Map<string, Record<string, unknown>>()
  const db = supabaseAdmin
  if (!db || !orders.length) return map

  const orderIds = orders.map((row) => String(row.id))
  const paymentIds = [
    ...new Set(
      orders
        .map((row) => (row.payment_id != null ? String(row.payment_id) : ''))
        .filter(Boolean)
    ),
  ]

  for (const columns of PAYMENT_SELECTS) {
    const byOrder = await db.from('payments').select(columns).in('order_id', orderIds)
    if (!byOrder.error && byOrder.data) {
      for (const row of byOrder.data as unknown as Array<Record<string, unknown>>) {
        const orderId = row.order_id != null ? String(row.order_id) : ''
        if (orderId && !map.has(orderId)) {
          map.set(orderId, row)
        }
      }
      if (paymentIds.length) {
        const byId = await db.from('payments').select(columns).in('id', paymentIds)
        if (!byId.error && byId.data) {
          const paymentById = new Map(
            (byId.data as unknown as Array<Record<string, unknown>>).map((row) => [
              String(row.id),
              row,
            ])
          )
          for (const order of orders) {
            const orderId = String(order.id)
            if (map.has(orderId)) continue
            const paymentId = order.payment_id != null ? String(order.payment_id) : ''
            const payment = paymentId ? paymentById.get(paymentId) : undefined
            if (payment) map.set(orderId, payment)
          }
        }
      }
      return map
    }
    if (byOrder.error && !isMissingColumnError(byOrder.error.message)) {
      return map
    }
  }
  return map
}

async function loadReviewerNames(ids: string[]) {
  const map = new Map<string, string>()
  if (!supabaseAdmin || !ids.length) return map
  const { data } = await supabaseAdmin
    .from('users')
    .select('id, first_name, last_name, email')
    .in('id', ids)
  for (const row of data ?? []) {
    const name =
      [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || String(row.email ?? '')
    if (name) map.set(String(row.id), name)
  }
  return map
}

async function loadSellingUnitLabels(productIds: string[]) {
  const map = new Map<string, string>()
  if (!supabaseAdmin || !productIds.length) return map
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, selling_quantity, selling_unit')
    .in('id', productIds)
  if (error || !data) return map
  for (const product of data) {
    map.set(
      String(product.id),
      formatSellingUnit(Number(product.selling_quantity), String(product.selling_unit ?? ''))
    )
  }
  return map
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
      'id, order_number, channel, status, payment_status, payment_method, total_amount, customer_name, customer_phone, customer_email, fulfillment_type, location_id, payment_id, order_date, created_at, paid_at',
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
    if (/location_id|customer_phone|customer_email|payment_id/i.test(error.message)) {
      return listStaffOrdersWithoutLocation(searchParams)
    }
    return { error: 'Failed to load orders', httpStatus: 500 as const }
  }

  return buildStaffOrderList(data ?? [], page, limit, count ?? 0)
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
      'id, order_number, channel, status, payment_status, payment_method, total_amount, customer_name, fulfillment_type, order_date, created_at, paid_at',
      { count: 'exact' }
    )
  if (channel) query = query.eq('channel', channel)
  if (status) query = query.eq('status', status)
  if (paymentStatus) query = query.eq('payment_status', paymentStatus)

  const { data, error, count } = await query
    .order('order_date', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) return { error: 'Failed to load orders', httpStatus: 500 as const }

  return buildStaffOrderList(
    (data ?? []).map((row) => ({ ...row, location_id: null, payment_id: null })),
    page,
    limit,
    count ?? 0
  )
}

async function buildStaffOrderList(
  rows: Array<Record<string, unknown>>,
  page: number,
  limit: number,
  total: number
) {
  const locationIds = [
    ...new Set(
      rows
        .map((row) => row.location_id)
        .filter(Boolean)
        .map(String)
    ),
  ]
  const locationNames = await loadLocationNames(locationIds)
  const payments = await loadPaymentsForOrders(rows)
  const reviewerIds = [
    ...new Set(
      [...payments.values()]
        .map((payment) => (payment.reviewed_by != null ? String(payment.reviewed_by) : ''))
        .filter(Boolean)
    ),
  ]
  const reviewerNames = await loadReviewerNames(reviewerIds)

  return {
    httpStatus: 200 as const,
    body: paginatedResponse({
      items: rows.map((row) => {
        const orderId = String(row.id)
        const paymentRow = payments.get(orderId) ?? null
        const reviewer =
          paymentRow?.reviewed_by != null
            ? reviewerNames.get(String(paymentRow.reviewed_by)) ?? null
            : null
        return mapOrderSummary(
          row,
          row.location_id ? locationNames.get(String(row.location_id)) ?? null : null,
          paymentRow ? mapStaffPayment(paymentRow, reviewer) : null
        )
      }),
      page,
      limit,
      total,
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

export async function getStaffOrderById(
  id: string,
  options: { includeCost?: boolean } = {}
) {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 as const }
  if (!parseOptionalUuid(id)) return { error: 'Invalid order id', httpStatus: 400 as const }
  const includeCost = Boolean(options.includeCost)

  let { data: order, error } = await supabaseAdmin
    .from('orders')
    .select(
      'id, order_number, channel, status, payment_status, payment_method, total_amount, customer_name, customer_phone, customer_email, fulfillment_type, delivery_address, notes, location_id, order_date, created_at, paid_at, payment_id, stock_state'
    )
    .eq('id', id)
    .maybeSingle()

  if (error && /location_id|stock_state|customer_phone|customer_email/i.test(error.message)) {
    const fallback = await supabaseAdmin
      .from('orders')
      .select(
        'id, order_number, channel, status, payment_status, payment_method, total_amount, customer_name, fulfillment_type, delivery_address, notes, order_date, created_at, paid_at, payment_id'
      )
      .eq('id', id)
      .maybeSingle()
    order = fallback.data
      ? ({
          ...fallback.data,
          location_id: null,
          stock_state: null,
          customer_phone: null,
          customer_email: null,
        } as typeof order)
      : null
    error = fallback.error
  }

  if (error) return { error: 'Failed to load order', httpStatus: 500 as const }
  if (!order) return { error: 'Order not found', httpStatus: 404 as const }

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('id, product_id, product_name, quantity, unit_price, unit_cost, line_total')
    .eq('order_id', id)

  const payment = await loadPaymentRow({
    paymentId: order.payment_id != null ? String(order.payment_id) : null,
    orderId: id,
  })

  let reviewerName: string | null = null
  if (payment?.reviewed_by) {
    const names = await loadReviewerNames([String(payment.reviewed_by)])
    reviewerName = names.get(String(payment.reviewed_by)) ?? null
  }

  const productIds = [
    ...new Set(
      (items ?? [])
        .map((line) => (line.product_id != null ? String(line.product_id) : ''))
        .filter(Boolean)
    ),
  ]
  const sellingUnits = await loadSellingUnitLabels(productIds)

  let locationName: string | null = null
  if (order.location_id) {
    const names = await loadLocationNames([String(order.location_id)])
    locationName = names.get(String(order.location_id)) ?? null
  }

  return {
    httpStatus: 200 as const,
    body: {
      item: {
        ...mapOrderSummary(
          order as Record<string, unknown>,
          locationName,
          payment ? mapStaffPayment(payment, reviewerName) : null
        ),
        notes: order.notes != null ? String(order.notes) : null,
        deliveryAddress:
          order.delivery_address != null ? String(order.delivery_address) : null,
        stockState: order.stock_state != null ? String(order.stock_state) : null,
        items: (items ?? []).map((line) => {
          const productId = line.product_id != null ? String(line.product_id) : null
          return {
            id: String(line.id),
            productName: String(line.product_name ?? ''),
            quantity: Number(line.quantity ?? 0),
            sellingUnit: productId ? sellingUnits.get(productId) ?? null : null,
            unitPrice: Number(line.unit_price ?? 0),
            lineTotal: Number(line.line_total ?? 0),
            ...(includeCost ? { unitCost: Number(line.unit_cost ?? 0) } : {}),
          }
        }),
      },
    },
  }
}

export async function updateStaffOrderFulfillment(input: {
  id: string
  status: unknown
  extraFields?: Record<string, unknown>
}) {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 as const }
  if (!parseOptionalUuid(input.id)) return { error: 'Invalid order id', httpStatus: 400 as const }

  const extra = input.extraFields ?? {}
  const forbidden = [
    'paymentStatus',
    'payment_status',
    'totalAmount',
    'total_amount',
    'unitCost',
    'unit_cost',
    'costPrice',
    'items',
    'stock',
    'stock_state',
    'stockState',
  ]
  if (forbidden.some((key) => extra[key] !== undefined)) {
    return { error: 'Fulfillment cannot change payment, price, or stock fields', httpStatus: 400 as const }
  }

  const status = String(input.status ?? '').trim().toLowerCase()
  if (!STAFF_FULFILLMENT_STATUSES.includes(status as StaffFulfillmentStatus)) {
    return { error: 'Invalid fulfillment status', httpStatus: 400 as const }
  }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('orders')
    .select('id, status, payment_status')
    .eq('id', input.id)
    .maybeSingle()

  if (fetchError) return { error: 'Failed to load order', httpStatus: 500 as const }
  if (!existing) return { error: 'Order not found', httpStatus: 404 as const }

  const previous = String(existing.status ?? '').toLowerCase()
  if (previous === 'cancelled' || previous === 'canceled') {
    return { error: 'Cancelled orders cannot be updated here', httpStatus: 409 as const }
  }

  if (String(existing.payment_status ?? '') !== 'paid') {
    return {
      error: 'Payment must be approved before fulfillment',
      httpStatus: 409 as const,
    }
  }

  const { error } = await supabaseAdmin
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)

  if (error) return { error: 'Failed to update order', httpStatus: 500 as const }
  return { httpStatus: 200 as const, body: { success: true, status } }
}
