import { PERMISSIONS, type Permission } from '@/lib/admin/permissions'

/**
 * Staff read-API permission mapping (Phase 1C.5 / 1C.5.x).
 * Arrays mean OR (any one grants access) via hasPermission.
 *
 * Product catalog READ uses shop:products_view (POS / lookup).
 * shop:products remains management and also grants view via alias expansion.
 */
export const STAFF_API_PERMISSIONS = {
  products: [PERMISSIONS.SHOP_PRODUCTS_VIEW, PERMISSIONS.SHOP_PRODUCTS] as Permission[],
  productManage: PERMISSIONS.SHOP_PRODUCTS,
  inventory: PERMISSIONS.SHOP_STOCK_VIEW,
  stockAdjust: PERMISSIONS.SHOP_STOCK_ADJUST,
  stockReceive: PERMISSIONS.SHOP_STOCK_RECEIVE,
  costPrice: PERMISSIONS.SHOP_COST_PRICE,
  sellingPrice: PERMISSIONS.SHOP_SELLING_PRICE,
  replenishment: PERMISSIONS.SHOP_REPLENISHMENT_VIEW,
  purchaseRequest: PERMISSIONS.SHOP_PURCHASE_REQUEST,
  orders: [PERMISSIONS.SHOP_ORDERS_VIEW, PERMISSIONS.SHOP_SALES_VIEW] as Permission[],
  /** Shop MoMo review — not payments:approve. Legacy shop:orders still qualifies. */
  paymentReview: [PERMISSIONS.SHOP_PAYMENTS_REVIEW, PERMISSIONS.SHOP_ORDERS] as Permission[],
  fulfillment: PERMISSIONS.SHOP_ORDERS_MANAGE,
  /** Financial + order metrics — not granted to every authenticated staff member. */
  dashboard: [PERMISSIONS.SHOP_SALES_VIEW, PERMISSIONS.SHOP_ORDERS_VIEW] as Permission[],
  refundsRequest: PERMISSIONS.SHOP_REFUNDS_REQUEST,
  refundsApprove: PERMISSIONS.SHOP_REFUNDS_APPROVE,
} as const
