import {
  loadCertificateBranding,
  resolveCertificateAsset,
} from '@/lib/certificate/branding'
import { COMPANY } from '@/lib/company/constants'
import { sendShopOrderReceiptEmail } from '@/lib/email/shop-order-receipt'
import { isCustomerReceiptEmail } from '@/lib/shop/customer-receipt-email'
import {
  createOrderReceiptHTML,
  type OrderReceiptData,
} from '@/lib/shop/order-receipt'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type SendConfirmedOrderReceiptResult =
  | { sent: true }
  | { sent: false; skipped: string }

function isConfirmedCommerceOrder(order: {
  status?: string | null
  payment_status?: string | null
}): boolean {
  const status = String(order.status ?? '').toLowerCase()
  const paymentStatus = String(order.payment_status ?? '').toLowerCase()
  return status === 'confirmed' || paymentStatus === 'paid'
}

export async function sendConfirmedOrderReceiptByOrderId(
  orderId: string,
): Promise<SendConfirmedOrderReceiptResult> {
  if (!supabaseAdmin) return { sent: false, skipped: 'no_database' }

  const id = String(orderId ?? '').trim()
  if (!id) return { sent: false, skipped: 'no_order' }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select(
      'id, order_number, customer_name, customer_email, customer_phone, fulfillment_type, delivery_address, notes, total_amount, status, payment_status, payment_method, order_date, created_at',
    )
    .eq('id', id)
    .maybeSingle()

  if (orderError || !order) return { sent: false, skipped: 'order_not_found' }
  if (!isConfirmedCommerceOrder(order)) {
    return { sent: false, skipped: 'not_confirmed' }
  }

  const orderNumber = String(order.order_number ?? '').trim()
  if (!orderNumber) return { sent: false, skipped: 'no_order_number' }

  const to = String(order.customer_email ?? '').trim()
  if (!isCustomerReceiptEmail(to)) {
    return { sent: false, skipped: 'no_customer_email' }
  }

  const { data: rows } = await supabaseAdmin
    .from('order_items')
    .select('product_name, quantity, unit_price, line_total')
    .eq('order_id', order.id)

  const branding = await loadCertificateBranding()
  const assetBase = COMPANY.publicSiteUrl
  const receipt: OrderReceiptData = {
    orderNumber,
    customerName: String(order.customer_name ?? '').trim() || 'Customer',
    customerEmail: to,
    customerPhone: order.customer_phone,
    fulfillmentType: order.fulfillment_type,
    deliveryAddress: order.delivery_address,
    notes: order.notes,
    totalAmount: Number(order.total_amount) || 0,
    orderStatus: order.status,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    orderDate: order.order_date || order.created_at || new Date().toISOString(),
    items: (rows ?? []).map((item) => ({
      productName: String(item.product_name ?? 'Product'),
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unit_price) || 0,
      lineTotal:
        Number(
          item.line_total ??
            Number(item.unit_price) * Number(item.quantity),
        ) || 0,
    })),
    logoUrl: resolveCertificateAsset(assetBase, branding.logoUrl),
    stampUrl: resolveCertificateAsset(assetBase, branding.stampUrl),
    signatoryName: branding.signatoryName,
    signatoryTitle: branding.signatoryTitle,
  }

  const receiptHtml = createOrderReceiptHTML(receipt, { autoPrint: false })
  const result = await sendShopOrderReceiptEmail({
    to,
    orderNumber,
    receiptHtml,
  })

  if (!result.success) {
    return { sent: false, skipped: 'email_failed' }
  }
  return { sent: true }
}
