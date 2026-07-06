import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'

type OrderPayment = {
  id: string
  amount: number
  status: string
  payment_method: string | null
  receipt_url: string | null
  receipt_number: string | null
  admin_notes: string | null
  created_at: string
}

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.SHOP_ORDERS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, items:order_items(*)')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const orders = data ?? []
    const paymentIds = [
      ...new Set(orders.map((o) => o.payment_id).filter(Boolean) as string[]),
    ]
    const orderIds = orders.map((o) => o.id)

    const paymentsById = new Map<string, OrderPayment>()
    const paymentsByOrderId = new Map<string, OrderPayment>()

    if (paymentIds.length) {
      let payments: Array<Record<string, unknown>> | null = null
      const withOrder = await supabaseAdmin
        .from('payments')
        .select(
          'id, amount, status, payment_method, receipt_url, receipt_number, admin_notes, created_at, order_id'
        )
        .in('id', paymentIds)

      if (withOrder.error?.message?.includes('order_id')) {
        const fallback = await supabaseAdmin
          .from('payments')
          .select(
            'id, amount, status, payment_method, receipt_url, receipt_number, admin_notes, created_at'
          )
          .in('id', paymentIds)
        payments = fallback.data
      } else {
        payments = withOrder.data
      }

      for (const p of payments ?? []) {
        paymentsById.set(String(p.id), p as OrderPayment)
        if (p.order_id) paymentsByOrderId.set(String(p.order_id), p as OrderPayment)
      }
    }

    if (orderIds.length) {
      const orderPaymentQuery = await supabaseAdmin
        .from('payments')
        .select(
          'id, amount, status, payment_method, receipt_url, receipt_number, admin_notes, created_at, order_id'
        )
        .in('order_id', orderIds)

      const orderPayments = orderPaymentQuery.error?.message?.includes('order_id')
        ? []
        : orderPaymentQuery.data ?? []

      for (const p of orderPayments) {
        if (p.order_id && !paymentsByOrderId.has(p.order_id)) {
          paymentsByOrderId.set(p.order_id, p as OrderPayment)
        }
        if (!paymentsById.has(p.id)) {
          paymentsById.set(p.id, p as OrderPayment)
        }
      }
    }

    const enriched = orders.map((order) => {
      const payment =
        (order.payment_id ? paymentsById.get(order.payment_id) : null) ??
        paymentsByOrderId.get(order.id) ??
        null
      return { ...order, payment }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load orders'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
