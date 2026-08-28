/** Same permission keys as the web staff portal. Do not invent a second model. */
export const PERMISSIONS = {
  SHOP_POS_SELL: 'shop:pos_sell',
  SHOP_ORDERS_VIEW: 'shop:orders_view',
  SHOP_ORDERS_MANAGE: 'shop:orders_manage',
  SHOP_PAYMENTS_REVIEW: 'shop:payments_review',
  SHOP_ORDERS: 'shop:orders',
  SHOP_PRODUCTS_VIEW: 'shop:products_view',
  SHOP_PRODUCTS: 'shop:products',
  SHOP_STOCK_VIEW: 'shop:stock_view',
  SHOP_STOCK_ADJUST: 'shop:stock_adjust',
  SHOP_SALES_VIEW: 'shop:sales_view',
  SHOP_REFUNDS_REQUEST: 'shop:refunds_request',
  SHOP_REFUNDS_APPROVE: 'shop:refunds_approve',
} as const

export type ShopPermission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export function hasPermission(
  permissions: string[] | undefined,
  required: string | string[]
): boolean {
  if (!permissions?.length) return false
  const list = Array.isArray(required) ? required : [required]
  return list.some((key) => permissions.includes(key))
}

export type StaffNavKey =
  | 'dashboard'
  | 'pos'
  | 'orders'
  | 'sales'
  | 'products'
  | 'inventory'
  | 'settings'

export type StaffNavItem = {
  key: StaffNavKey
  href: string
  label: string
  permissions: string[]
}

export const STAFF_NAV_ITEMS: StaffNavItem[] = [
  { key: 'dashboard', href: '/staff', label: 'Dashboard', permissions: [] },
  { key: 'pos', href: '/staff/pos', label: 'POS', permissions: [PERMISSIONS.SHOP_POS_SELL] },
  {
    key: 'orders',
    href: '/staff/orders',
    label: 'Orders',
    permissions: [PERMISSIONS.SHOP_ORDERS_VIEW],
  },
  {
    key: 'sales',
    href: '/staff/sales',
    label: 'Sales',
    permissions: [PERMISSIONS.SHOP_SALES_VIEW, PERMISSIONS.SHOP_ORDERS_VIEW],
  },
  {
    key: 'products',
    href: '/staff/products',
    label: 'Products',
    permissions: [PERMISSIONS.SHOP_PRODUCTS_VIEW, PERMISSIONS.SHOP_PRODUCTS],
  },
  {
    key: 'inventory',
    href: '/staff/inventory',
    label: 'Inventory',
    permissions: [PERMISSIONS.SHOP_STOCK_VIEW],
  },
  { key: 'settings', href: '/staff/settings', label: 'Settings', permissions: [] },
]

export function canSeeStaffNavItem(
  permissions: string[] | undefined,
  item: StaffNavItem
): boolean {
  if (!item.permissions.length) return true
  return hasPermission(permissions, item.permissions)
}

export function filterStaffNavItems(permissions: string[] | undefined): StaffNavItem[] {
  return STAFF_NAV_ITEMS.filter((item) => canSeeStaffNavItem(permissions, item))
}

export function canReviewShopPayments(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, [PERMISSIONS.SHOP_PAYMENTS_REVIEW, PERMISSIONS.SHOP_ORDERS])
}

export function canManageFulfillment(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, PERMISSIONS.SHOP_ORDERS_MANAGE)
}

export function canViewProductCost(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, PERMISSIONS.SHOP_PRODUCTS)
}

export function canRequestShopRefund(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, PERMISSIONS.SHOP_REFUNDS_REQUEST)
}

export function canApproveShopRefund(permissions: string[] | undefined): boolean {
  return hasPermission(permissions, PERMISSIONS.SHOP_REFUNDS_APPROVE)
}

export function canAccessStaffPath(
  pathname: string,
  permissions: string[] | undefined
): boolean {
  const matches = STAFF_NAV_ITEMS.filter(
    (entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`)
  )
  if (!matches.length) return true
  const item = matches.sort((a, b) => b.href.length - a.href.length)[0]
  return canSeeStaffNavItem(permissions, item)
}
