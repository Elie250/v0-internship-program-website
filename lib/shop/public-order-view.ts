import { isUuidLike } from '@/lib/shop/public-catalogue'
import { getDefaultStorefrontShop } from '@/lib/shop/storefront-shops'

export type PublicOrderStatus =
  | 'received'
  | 'payment_awaiting'
  | 'payment_confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

export type PublicPaymentStatus = 'awaiting' | 'confirmed' | 'not_completed'

export type PublicPaymentMethod = 'momo' | 'cash'

export type PublicOrderItem = {
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
  sellingUnitLabel: string | null
}

export type PublicOrderView = {
  orderNumber: string
  shopName: string
  orderDate: string
  status: PublicOrderStatus
  paymentStatus: PublicPaymentStatus
  paymentMethod: PublicPaymentMethod
  fulfillmentType: 'pickup' | 'delivery'
  deliveryAddress: string | null
  totalAmount: number
  items: PublicOrderItem[]
}

/** Input shape from lookupOrder()'s found result — no ids. */
export type PublicOrderLookupSource = {
  orderNumber: string
  fulfillmentType: string
  deliveryAddress: string | null
  totalAmount: number
  orderStatus: string
  paymentStatus: string | null
  paymentMethod: string | null
  orderDate: string
  items: PublicOrderItem[]
}

function normalizeTrackCode(raw: string): string {
  try {
    return decodeURIComponent(raw).trim().toUpperCase()
  } catch {
    return raw.trim().toUpperCase()
  }
}

/** Reject empty codes and UUID-shaped input — public lookup is order_number only. */
export function isPublicTrackableOrderNumber(raw: string): boolean {
  const code = normalizeTrackCode(raw)
  if (!code) return false
  if (isUuidLike(code)) return false
  return true
}

export function mapPublicOrderStatus(
  orderStatus: string | null | undefined,
  paymentStatus: string | null | undefined
): PublicOrderStatus {
  const order = String(orderStatus || '').trim().toLowerCase()
  const pay = String(paymentStatus || '').trim().toLowerCase()

  if (order === 'cancelled' || order === 'canceled') return 'cancelled'
  if (order === 'completed') return 'completed'
  if (order === 'ready' || order === 'ready_for_pickup') return 'ready'
  if (order === 'preparing' || order === 'processing') return 'preparing'
  if (pay === 'paid' || pay === 'approved') return 'payment_confirmed'
  if (pay === 'pending_review' || pay === 'pending' || pay === 'gateway_pending') {
    return 'payment_awaiting'
  }
  if (order === 'confirmed') return 'payment_confirmed'
  return 'received'
}

export function mapPublicPaymentStatus(
  paymentStatus: string | null | undefined
): PublicPaymentStatus {
  const pay = String(paymentStatus || '').trim().toLowerCase()
  if (pay === 'paid' || pay === 'approved') return 'confirmed'
  if (pay === 'rejected' || pay === 'failed' || pay === 'unpaid') return 'not_completed'
  return 'awaiting'
}

export function mapPublicPaymentMethod(
  paymentMethod: string | null | undefined
): PublicPaymentMethod {
  if (/cash/i.test(String(paymentMethod || ''))) return 'cash'
  return 'momo'
}

export function toPublicOrderView(result: PublicOrderLookupSource): PublicOrderView {
  return {
    orderNumber: result.orderNumber,
    shopName: getDefaultStorefrontShop().name,
    orderDate: result.orderDate,
    status: mapPublicOrderStatus(result.orderStatus, result.paymentStatus),
    paymentStatus: mapPublicPaymentStatus(result.paymentStatus),
    paymentMethod: mapPublicPaymentMethod(result.paymentMethod),
    fulfillmentType: result.fulfillmentType === 'delivery' ? 'delivery' : 'pickup',
    deliveryAddress:
      result.fulfillmentType === 'delivery' && result.deliveryAddress
        ? result.deliveryAddress
        : null,
    totalAmount: result.totalAmount,
    items: result.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      sellingUnitLabel: item.sellingUnitLabel ?? null,
    })),
  }
}
