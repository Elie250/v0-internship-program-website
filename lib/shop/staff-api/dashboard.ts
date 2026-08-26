import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { BUSINESS_TIMEZONE, kigaliCalendarDate, kigaliDayUtcBounds } from '@/lib/shop/staff-api/common'

export type StaffDashboardReport = {
  timezone: typeof BUSINESS_TIMEZONE
  businessDate: string
  todaySales: number
  todayOrders: number
  todayPosOrders: number
  todayOnlineOrders: number
  pendingOrders: number
  catalogItems: number
  inStockItems: number
  lowStockItems: number
  outOfStockItems: number
  stockModel: 'global_products_stock'
  /** Null until a dedicated audited profit report exists. */
  profit: null
}

/**
 * Server-computed shop dashboard metrics for Africa/Kigali "today".
 * Same contract as GET /api/staff/reports/dashboard.
 * Does not expose profit unless later phases provide a dedicated, audited calculation.
 */
export async function getStaffDashboardReport(): Promise<
  | { httpStatus: 200; body: StaffDashboardReport; error?: undefined }
  | { error: string; httpStatus: 500 }
> {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 as const }

  const { startIso, endIso } = kigaliDayUtcBounds()
  const today = kigaliCalendarDate()

  const { data: todayOrders, error: todayError } = await supabaseAdmin
    .from('orders')
    .select('id, total_amount, payment_status, channel, status')
    .gte('order_date', startIso)
    .lte('order_date', endIso)

  if (todayError) return { error: 'Failed to load dashboard orders', httpStatus: 500 as const }

  let todaySales = 0
  let todayOrdersCount = 0
  let todayPosOrders = 0
  let todayOnlineOrders = 0

  for (const order of todayOrders ?? []) {
    todayOrdersCount += 1
    if (order.channel === 'pos') todayPosOrders += 1
    if (order.channel === 'online') todayOnlineOrders += 1
    const paid = ['paid', 'approved'].includes(String(order.payment_status ?? ''))
    if (paid) todaySales += Number(order.total_amount ?? 0)
  }

  const { count: pendingOrders } = await supabaseAdmin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .in('payment_status', ['unpaid', 'pending_review', 'gateway_pending'])

  const { data: stockRows, error: stockError } = await supabaseAdmin
    .from('products')
    .select('id, stock, low_stock_threshold, status')

  if (stockError) return { error: 'Failed to load dashboard stock', httpStatus: 500 as const }

  let catalogItems = 0
  let inStockItems = 0
  let lowStockItems = 0
  let outOfStockItems = 0

  for (const row of stockRows ?? []) {
    if (row.status && row.status !== 'published' && row.status !== 'draft') continue
    catalogItems += 1
    const stock = Number(row.stock ?? 0)
    const threshold = Number(row.low_stock_threshold ?? 5)
    if (stock <= 0) outOfStockItems += 1
    else inStockItems += 1
    if (stock > 0 && stock <= threshold) lowStockItems += 1
  }

  return {
    httpStatus: 200 as const,
    body: {
      timezone: BUSINESS_TIMEZONE,
      businessDate: today,
      todaySales,
      todayOrders: todayOrdersCount,
      todayPosOrders,
      todayOnlineOrders,
      pendingOrders: pendingOrders ?? 0,
      catalogItems,
      inStockItems,
      lowStockItems,
      outOfStockItems,
      stockModel: 'global_products_stock' as const,
      profit: null,
    },
  }
}
