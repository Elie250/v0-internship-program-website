import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type FinancialSummary = {
  totalRevenue: number
  learningRevenue: number
  supportRevenue: number
  shopGrossRevenue: number
  shopNetProfit: number
  shopCogs: number
  shopOrdersPaid: number
  shopOrdersPending: number
  posRevenue: number
  pendingPaymentsCount: number
  recentShopOrders: Array<{
    id: string
    order_number: string
    customer_name: string
    total_amount: number
    payment_status: string
    channel: string
    order_date: string
  }>
}

const APPROVED = ['approved', 'Paid']

export async function loadFinancialSummary(): Promise<FinancialSummary> {
  const empty: FinancialSummary = {
    totalRevenue: 0,
    learningRevenue: 0,
    supportRevenue: 0,
    shopGrossRevenue: 0,
    shopNetProfit: 0,
    shopCogs: 0,
    shopOrdersPaid: 0,
    shopOrdersPending: 0,
    posRevenue: 0,
    pendingPaymentsCount: 0,
    recentShopOrders: [],
  }

  if (!supabaseAdmin) return empty

  const { data: payments } = await supabaseAdmin
    .from('payments')
    .select('amount, status, course_enrollment_id, support_subscription_id, order_id')

  const approved = (payments ?? []).filter((p) => APPROVED.includes(String(p.status)))
  const pending = (payments ?? []).filter((p) =>
    ['pending_review', 'gateway_pending', 'pending', 'Pending'].includes(String(p.status))
  )

  let learningRevenue = 0
  let supportRevenue = 0
  let shopFromPayments = 0

  for (const p of approved) {
    const amount = Number(p.amount ?? 0)
    if (p.course_enrollment_id) learningRevenue += amount
    else if (p.support_subscription_id) supportRevenue += amount
    else if (p.order_id) shopFromPayments += amount
  }

  const { data: paidOrders } = await supabaseAdmin
    .from('orders')
    .select('id, total_amount, payment_status, channel, order_number, customer_name, order_date')
    .in('payment_status', ['paid', 'approved'])
    .order('order_date', { ascending: false })
    .limit(50)

  const { data: pendingOrders } = await supabaseAdmin
    .from('orders')
    .select('id')
    .in('payment_status', ['unpaid', 'pending_review', 'gateway_pending'])

  let shopGrossRevenue = 0
  let shopCogs = 0
  let posRevenue = 0

  for (const order of paidOrders ?? []) {
    const total = Number(order.total_amount ?? 0)
    shopGrossRevenue += total
    if (order.channel === 'pos') posRevenue += total

    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('quantity, unit_cost')
      .eq('order_id', order.id)

    for (const item of items ?? []) {
      shopCogs += Number(item.quantity ?? 0) * Number(item.unit_cost ?? 0)
    }
  }

  // Include shop revenue from approved payments not yet reflected in order payment_status
  shopGrossRevenue = Math.max(shopGrossRevenue, shopFromPayments)
  const shopNetProfit = shopGrossRevenue - shopCogs
  const totalRevenue = learningRevenue + supportRevenue + shopGrossRevenue

  const { data: recentOrders } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, customer_name, total_amount, payment_status, channel, order_date')
    .order('order_date', { ascending: false })
    .limit(10)

  return {
    totalRevenue,
    learningRevenue,
    supportRevenue,
    shopGrossRevenue,
    shopNetProfit,
    shopCogs,
    shopOrdersPaid: (paidOrders ?? []).length,
    shopOrdersPending: (pendingOrders ?? []).length,
    posRevenue,
    pendingPaymentsCount: pending.length,
    recentShopOrders: (recentOrders ?? []).map((o) => ({
      id: String(o.id),
      order_number: String(o.order_number ?? ''),
      customer_name: String(o.customer_name ?? ''),
      total_amount: Number(o.total_amount ?? 0),
      payment_status: String(o.payment_status ?? 'unpaid'),
      channel: String(o.channel ?? 'online'),
      order_date: String(o.order_date ?? ''),
    })),
  }
}
