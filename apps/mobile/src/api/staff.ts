import { publicRequest, staffRequest } from '@/src/api/client'
import type {
  Paginated,
  PosSaleResult,
  ShopCategory,
  StaffDashboard,
  StaffInventoryRow,
  StaffOrderDetail,
  StaffOrderSummary,
  StaffProduct,
  StaffRefund,
  StaffUser,
} from '@/src/api/types'

export async function loginStaff(email: string, password: string) {
  return staffRequest<{
    token: string
    expiresAt: string
    sessionId: string
    user: StaffUser
  }>('/api/staff/auth', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    expireOn401: false,
    isLogin: true,
    auth: false,
  })
}

export async function fetchStaffSession() {
  return staffRequest<{ user: StaffUser; sessionId: string }>('/api/staff/auth')
}

export async function logoutStaff() {
  return staffRequest<{ success: boolean }>('/api/staff/auth', { method: 'DELETE' })
}

export async function fetchDashboard() {
  return staffRequest<StaffDashboard>('/api/staff/reports/dashboard')
}

export async function fetchOrders(params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value != null && String(value).length) search.set(key, String(value))
  }
  const suffix = search.toString() ? `?${search.toString()}` : ''
  return staffRequest<Paginated<StaffOrderSummary>>(`/api/staff/orders${suffix}`)
}

export async function fetchOrder(id: string) {
  return staffRequest<{ item: StaffOrderDetail }>(`/api/staff/orders/${id}`)
}

export async function reviewShopPayment(input: {
  orderId: string
  decision: 'approve' | 'reject'
  adminNotes?: string
}) {
  return staffRequest<{ success: boolean }>('/api/staff/payments/review', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateOrderFulfillment(id: string, status: string) {
  return staffRequest<{ success: boolean; status: string }>(`/api/staff/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function fetchProducts(params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value != null && String(value).length) search.set(key, String(value))
  }
  const suffix = search.toString() ? `?${search.toString()}` : ''
  return staffRequest<Paginated<StaffProduct>>(`/api/staff/products${suffix}`)
}

export async function fetchShopCategories() {
  return publicRequest<ShopCategory[]>('/api/categories?type=shop')
}

export async function createStaffProduct(input: {
  name: string
  description?: string | null
  sku?: string | null
  barcode?: string | null
  categoryId?: string | null
  price?: number
  costPrice?: number
  images?: string[]
}) {
  return staffRequest<{ item: StaffProduct }>('/api/staff/products', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function uploadStaffProductImage(uri: string) {
  const body = new FormData()
  body.append('folder', 'products')
  body.append('file', { uri, name: 'product.jpg', type: 'image/jpeg' } as unknown as Blob)
  return staffRequest<{ url: string }>('/api/staff/upload', {
    method: 'POST',
    body,
    timeoutMs: 60_000,
  })
}

export async function updateStaffProduct(
  id: string,
  input: Record<string, unknown>
) {
  return staffRequest<{ item: StaffProduct }>(`/api/staff/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function adjustStaffStock(input: {
  productId: string
  quantityDelta: number
  reason: string
}) {
  return staffRequest('/api/staff/inventory/adjust', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function receiveStaffStock(input: {
  productId: string
  quantity: number
  reason: string
}) {
  return staffRequest('/api/staff/inventory/receive', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function fetchReplenishment(params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value != null && String(value).length) search.set(key, String(value))
  }
  const suffix = search.toString() ? `?${search.toString()}` : ''
  return staffRequest<Paginated<StaffInventoryRow>>(`/api/staff/inventory/replenishment${suffix}`)
}

export async function createPurchaseRequest(input: {
  productId: string
  quantity: number
  notes?: string
}) {
  return staffRequest('/api/staff/inventory/purchase-requests', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function fetchInventory(params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value != null && String(value).length) search.set(key, String(value))
  }
  const suffix = search.toString() ? `?${search.toString()}` : ''
  return staffRequest<Paginated<StaffInventoryRow>>(`/api/staff/inventory${suffix}`)
}

export async function createPosSale(input: {
  items: Array<{ productId: string; quantity: number }>
  customerName?: string
  customerPhone?: string | null
  paymentMethod: 'cash' | 'momo'
  idempotencyKey: string
}) {
  return staffRequest<PosSaleResult>('/api/staff/pos/sales', {
    method: 'POST',
    headers: { 'Idempotency-Key': input.idempotencyKey },
    body: JSON.stringify({
      items: input.items,
      customerName: input.customerName,
      customerPhone: input.customerPhone ?? null,
      paymentMethod: input.paymentMethod,
      idempotencyKey: input.idempotencyKey,
    }),
  })
}

export async function requestShopRefund(input: {
  orderId: string
  items: Array<{ orderItemId: string; quantity: number }>
  reason: string
  notes?: string
  idempotencyKey: string
}) {
  return staffRequest<{ success: boolean; refund: StaffRefund }>(
    `/api/staff/orders/${input.orderId}/refunds`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': input.idempotencyKey },
      body: JSON.stringify({
        items: input.items,
        reason: input.reason,
        notes: input.notes,
        idempotencyKey: input.idempotencyKey,
      }),
    }
  )
}

export async function decideShopRefund(input: {
  refundId: string
  decision: 'approve' | 'reject'
  notes?: string
  idempotencyKey: string
}) {
  return staffRequest<{ success: boolean; refund: StaffRefund; replay?: boolean }>(
    `/api/staff/refunds/${input.refundId}/decision`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': input.idempotencyKey },
      body: JSON.stringify({
        decision: input.decision,
        notes: input.notes,
        idempotencyKey: input.idempotencyKey,
      }),
    }
  )
}
