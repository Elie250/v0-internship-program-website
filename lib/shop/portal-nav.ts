import { hasPermission, PERMISSIONS, type Permission } from '@/lib/admin/permissions'

/**
 * UI-only operational context label for the current physical deployment.
 * Not an inventory/location authority — location data model is a separate phase.
 */
export const SHOP_PORTAL_DISPLAY = {
  brandName: 'Energy & Logics Shop',
  /** Display-only site label for the current Nyanza deployment. */
  siteLabel: 'Nyanza Shop',
} as const

export type ShopNavItem = {
  href: string
  label: string
  description: string
  /** If empty, any authenticated shop staff may see the link. */
  permissions: Permission[]
  icon: 'dashboard' | 'pos' | 'products' | 'inventory' | 'sales' | 'settings'
}

export const SHOP_NAV_ITEMS: ShopNavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    description: 'Overview of shop operations',
    permissions: [],
    icon: 'dashboard',
  },
  {
    href: '/pos',
    label: 'POS',
    description: 'Point of sale terminal',
    permissions: [PERMISSIONS.SHOP_POS_SELL],
    icon: 'pos',
  },
  {
    href: '/products',
    label: 'Products',
    description: 'Product catalog',
    permissions: [PERMISSIONS.SHOP_PRODUCTS_VIEW, PERMISSIONS.SHOP_PRODUCTS],
    icon: 'products',
  },
  {
    href: '/inventory',
    label: 'Inventory',
    description: 'Stock levels and movements',
    permissions: [PERMISSIONS.SHOP_STOCK_VIEW],
    icon: 'inventory',
  },
  {
    href: '/sales',
    label: 'Sales',
    description: 'Sales and order history',
    permissions: [PERMISSIONS.SHOP_SALES_VIEW, PERMISSIONS.SHOP_ORDERS_VIEW],
    icon: 'sales',
  },
  {
    href: '/settings',
    label: 'Settings',
    description: 'Account and shop preferences',
    permissions: [],
    icon: 'settings',
  },
]

export function canSeeShopNavItem(
  permissions: string[] | undefined,
  item: ShopNavItem
): boolean {
  if (!item.permissions.length) return true
  return hasPermission(permissions, item.permissions)
}

export function filterShopNavItems(permissions: string[] | undefined): ShopNavItem[] {
  return SHOP_NAV_ITEMS.filter((item) => canSeeShopNavItem(permissions, item))
}

export function canAccessShopPath(
  pathname: string,
  permissions: string[] | undefined
): boolean {
  const item = SHOP_NAV_ITEMS.find(
    (entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`)
  )
  if (!item) return true
  return canSeeShopNavItem(permissions, item)
}

export function roleDisplayLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Administrator',
    salesperson: 'Salesperson',
    inventory_manager: 'Inventory manager',
    support_staff: 'Support staff',
    engineer: 'Engineer',
  }
  return labels[role] ?? role.replace(/_/g, ' ')
}
