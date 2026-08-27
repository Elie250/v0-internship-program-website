import { lookupOrder } from '@/lib/shop/order-lookup'
import {
  isPublicTrackableOrderNumber,
  toPublicOrderView,
  type PublicOrderView,
} from '@/lib/shop/public-order-view'

export type { PublicOrderView } from '@/lib/shop/public-order-view'

/**
 * Customer-safe order lookup. Uses lookupOrder() (order_number only).
 * Never returns order UUID, product UUID, cost, or staff fields.
 */
export async function getPublicOrder(rawCode: string): Promise<PublicOrderView | null> {
  if (!isPublicTrackableOrderNumber(rawCode)) return null
  const result = await lookupOrder(rawCode)
  if (result.status !== 'found') return null
  return toPublicOrderView({
    orderNumber: result.orderNumber,
    fulfillmentType: result.fulfillmentType,
    deliveryAddress: result.deliveryAddress,
    totalAmount: result.totalAmount,
    orderStatus: result.orderStatus,
    paymentStatus: result.paymentStatus,
    paymentMethod: result.paymentMethod,
    orderDate: result.orderDate,
    items: result.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      sellingUnitLabel: item.sellingUnitLabel ?? null,
    })),
  })
}
