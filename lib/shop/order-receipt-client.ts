import { createOrderReceiptHTML, type OrderReceiptData } from '@/lib/shop/order-receipt'

type PrintableOrder = {
  order_number?: string
  id: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  fulfillment_type?: string
  delivery_address?: string | null
  notes?: string | null
  total_amount: number
  status?: string
  payment_status?: string | null
  payment_method?: string | null
  created_at: string
  items?: Array<{
    product_name?: string
    quantity: number
    unit_price: number
    line_total?: number
  }>
  payment?: {
    status?: string
    payment_method?: string | null
  } | null
}

/** Open a print-ready official receipt (delivery/refund copy) with QR + stamp. */
export async function printOrderReceipt(order: PrintableOrder): Promise<void> {
  const orderNumber = order.order_number || order.id.slice(0, 8).toUpperCase()
  let branding: {
    logoUrl?: string
    stampUrl?: string
    signatoryName?: string
    signatoryTitle?: string
  } = {}
  try {
    const res = await fetch('/api/public/certificate-branding')
    if (res.ok) branding = await res.json()
  } catch {
    // defaults inside HTML builder
  }

  const data: OrderReceiptData = {
    orderNumber,
    customerName: order.customer_name || 'Customer',
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    fulfillmentType: order.fulfillment_type,
    deliveryAddress: order.delivery_address,
    notes: order.notes,
    totalAmount: Number(order.total_amount) || 0,
    orderStatus: order.status,
    paymentStatus: order.payment?.status || order.payment_status,
    paymentMethod: order.payment?.payment_method || order.payment_method,
    orderDate: order.created_at,
    items: (order.items ?? []).map((item) => ({
      productName: item.product_name || 'Product',
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unit_price) || 0,
      lineTotal: Number(item.line_total ?? Number(item.unit_price) * Number(item.quantity)) || 0,
    })),
    logoUrl: branding.logoUrl,
    stampUrl: branding.stampUrl,
    signatoryName: branding.signatoryName,
    signatoryTitle: branding.signatoryTitle,
  }

  const html = createOrderReceiptHTML(data)
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  printWindow.document.write(html)
  printWindow.document.close()
}
