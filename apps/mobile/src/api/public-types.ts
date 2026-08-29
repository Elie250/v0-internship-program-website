export type PublicAvailability = 'available' | 'few' | 'out'

export type PublicCatalogueCategory = {
  name: string
  slug: string
}

/** Public storefront product. No cost, staff permissions, or internal UUID. */
export type PublicCatalogueItem = {
  slug: string
  name: string
  description: string | null
  image: string | null
  price: number
  listPrice: number | null
  discountAmount: number | null
  sellingQuantity: number
  sellingUnit: string
  sellingUnitLabel: string
  categoryName: string | null
  categorySlug: string | null
  sku: string | null
  availability: PublicAvailability
  inStock: boolean
  maxQuantity: number
  featured: boolean
}

export type PublicShopOrderCreated = {
  success: true
  orderNumber: string
  totalAmount: number
  shopName: string
  status: 'pending'
  paymentStatus: 'pending'
  message: string
}

export type PublicOrderStatus =
  | 'received'
  | 'payment_awaiting'
  | 'payment_confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

export type PublicPaymentStatus = 'awaiting' | 'confirmed' | 'not_completed'

export type PublicTrackedOrder = {
  orderNumber: string
  shopName: string
  orderDate: string
  status: PublicOrderStatus
  paymentStatus: PublicPaymentStatus
  paymentMethod: 'momo' | 'cash'
  fulfillmentType: 'pickup' | 'delivery'
  deliveryAddress: string | null
  totalAmount: number
  items: Array<{
    productName: string
    quantity: number
    unitPrice: number
    lineTotal: number
    sellingUnitLabel: string | null
  }>
}
