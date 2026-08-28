export type StaffUser = {
  id: string
  email: string
  role: string
  firstName: string
  lastName: string
  permissions: string[]
  canAccessAdmin: boolean
}

export type Paginated<T> = {
  items: T[]
  page: number
  limit: number
  total: number
}

export type StaffDashboard = {
  timezone: string
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
  profit: null
}

export type StaffPayment = {
  amount: number
  status: string
  paymentMethod: string | null
  proofUrl: string | null
  referenceNumber: string | null
  notes: string | null
  submittedAt: string | null
  createdAt?: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  paidAt: string | null
}

export type StaffOrderSummary = {
  id: string
  orderNumber: string | null
  channel: string | null
  status: string | null
  paymentStatus: string | null
  paymentMethod: string | null
  totalAmount: number
  customerName: string | null
  customerPhone: string | null
  customerEmail: string | null
  orderDate: string | null
  createdAt: string | null
  payment: StaffPayment | null
}

export type StaffOrderDetail = StaffOrderSummary & {
  notes: string | null
  deliveryAddress: string | null
  items: Array<{
    id: string
    productName: string
    quantity: number
    sellingUnit: string | null
    unitPrice: number
    lineTotal: number
    unitCost?: number
  }>
}

export type StaffProduct = {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  price: number
  discount: number
  costPrice?: number
  stock: number
  status: string | null
  sellingQuantity: number
  sellingUnit: string
  sellingUnitLabel: string
  categoryId?: string | null
  category?: { id: string; name: string; slug: string | null; type: string | null } | null
  images?: unknown
  lowStockThreshold?: number | null
}

export type StaffInventoryRow = {
  productId: string
  name: string
  sku: string | null
  currentStock: number
  lowStockThreshold: number
  isLowStock: boolean
  status: string | null
  price: number
}

export type PosSaleResult = {
  success: boolean
  orderNumber?: string
  totalAmount?: number
  paymentStatus?: string
  message?: string
  error?: string
}
