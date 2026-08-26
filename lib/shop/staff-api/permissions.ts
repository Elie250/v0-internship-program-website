import { PERMISSIONS, type Permission } from '@/lib/admin/permissions'

/**
 * Staff read-API permission mapping (Phase 1C.5).
 * Arrays mean OR (any one grants access) via hasPermission.
 */
export const STAFF_API_PERMISSIONS = {
  products: PERMISSIONS.SHOP_PRODUCTS,
  inventory: PERMISSIONS.SHOP_STOCK_VIEW,
  orders: [PERMISSIONS.SHOP_ORDERS_VIEW, PERMISSIONS.SHOP_SALES_VIEW] as Permission[],
  /** Financial + order metrics — not granted to every authenticated staff member. */
  dashboard: [PERMISSIONS.SHOP_SALES_VIEW, PERMISSIONS.SHOP_ORDERS_VIEW] as Permission[],
} as const
