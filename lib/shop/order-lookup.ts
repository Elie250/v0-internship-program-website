import { COMPANY } from '@/lib/company/constants'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type OrderLookupItem = {
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type OrderLookupResult =
  | {
      status: 'found'
      orderNumber: string
      customerName: string
      customerPhone: string | null
      fulfillmentType: string
      deliveryAddress: string | null
      totalAmount: number
      orderStatus: string
      paymentStatus: string | null
      paymentMethod: string | null
      orderDate: string
      items: OrderLookupItem[]
    }
  | {
      status: 'not_found'
      orderNumber: string
    }

export function normalizeOrderCode(raw: string): string {
  return decodeURIComponent(raw).trim().toUpperCase()
}

export function getOrderReceiptUrl(orderNumber: string): string {
  const code = encodeURIComponent(normalizeOrderCode(orderNumber))
  return `${COMPANY.publicSiteUrl}/receipt/${code}`
}

export function getOrderQrImageUrl(orderNumber: string): string {
  const receiptUrl = getOrderReceiptUrl(orderNumber)
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(receiptUrl)}`
}

export async function lookupOrder(rawCode: string): Promise<OrderLookupResult> {
  const orderNumber = normalizeOrderCode(rawCode)
  if (!orderNumber) {
    return { status: 'not_found', orderNumber: '' }
  }
  if (!supabaseAdmin) {
    return { status: 'not_found', orderNumber }
  }

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select(
      'id, order_number, customer_name, customer_phone, fulfillment_type, delivery_address, total_amount, status, payment_status, payment_method, order_date, created_at'
    )
    .eq('order_number', orderNumber)
    .maybeSingle()

  if (!order) {
    return { status: 'not_found', orderNumber }
  }

  const { data: rows } = await supabaseAdmin
    .from('order_items')
    .select('product_name, quantity, unit_price, line_total')
    .eq('order_id', order.id)

  const items: OrderLookupItem[] = (rows ?? []).map((row) => ({
    productName: String(row.product_name ?? 'Product'),
    quantity: Number(row.quantity) || 0,
    unitPrice: Number(row.unit_price) || 0,
    lineTotal: Number(row.line_total ?? Number(row.unit_price) * Number(row.quantity)) || 0,
  }))

  return {
    status: 'found',
    orderNumber: String(order.order_number),
    customerName: String(order.customer_name || 'Customer'),
    customerPhone: order.customer_phone ? String(order.customer_phone) : null,
    fulfillmentType: String(order.fulfillment_type || 'pickup'),
    deliveryAddress: order.delivery_address ? String(order.delivery_address) : null,
    totalAmount: Number(order.total_amount) || 0,
    orderStatus: String(order.status || 'pending'),
    paymentStatus: order.payment_status ? String(order.payment_status) : null,
    paymentMethod: order.payment_method ? String(order.payment_method) : null,
    orderDate: String(order.order_date || order.created_at || new Date().toISOString()),
    items,
  }
}
