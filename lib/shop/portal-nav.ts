import { hasPermission, PERMISSIONS, type Permission } from '@/lib/admin/permissions'
import type { ShopMessageKey } from '@/lib/shop/i18n/messages/en'

/**
 * UI-only operational context label for the current physical deployment.
 * Not an inventory/location authority — location data model is a separate phase.
 * Display strings are localized via Shop i18n (`brand.*` keys).
 */
export const SHOP_PORTAL_DISPLAY = {
  brandName: 'Energy & Logics Shop',
  /** Display-only site label for the current Nyanza deployment (EN source). */
  siteLabel: 'Nyanza Shop',
} as const

export type ShopNavItem = {
  href: string
  labelKey: ShopMessageKey
  descriptionKey: ShopMessageKey
  /** @deprecated Prefer labelKey — kept for tests that read English source via messages. */
  label: string
  description: string
  /** If empty, any authenticated shop staff may see the link (unless adminOnly). */
  permissions: Permission[]
  /** Administrator role only — Staff Management. */
  adminOnly?: boolean
  icon: 'dashboard' | 'pos' | 'products' | 'inventory' | 'sales' | 'settings' | 'users'
}

export const SHOP_NAV_ITEMS: ShopNavItem[] = [
  {
    href: '/dashboard',
    labelKey: 'nav.dashboard',
    descriptionKey: 'nav.dashboardDesc',
    label: 'Dashboard',
    description: 'Overview of shop operations',
    permissions: [],
    icon: 'dashboard',
  },
  {
    href: '/pos',
    labelKey: 'nav.pos',
    descriptionKey: 'nav.posDesc',
    label: 'POS',
    description: 'Point of sale terminal',
    permissions: [PERMISSIONS.SHOP_POS_SELL],
    icon: 'pos',
  },
  {
    href: '/products',
    labelKey: 'nav.products',
    descriptionKey: 'nav.productsDesc',
    label: 'Products',
    description: 'Product catalog',
    permissions: [PERMISSIONS.SHOP_PRODUCTS_VIEW, PERMISSIONS.SHOP_PRODUCTS],
    icon: 'products',
  },
  {
    href: '/inventory',
    labelKey: 'nav.inventory',
    descriptionKey: 'nav.inventoryDesc',
    label: 'Inventory',
    description: 'Stock levels and movements',
    permissions: [PERMISSIONS.SHOP_STOCK_VIEW],
    icon: 'inventory',
  },
  {
    href: '/sales',
    labelKey: 'nav.sales',
    descriptionKey: 'nav.salesDesc',
    label: 'Sales',
    description: 'Sales and order history',
    permissions: [PERMISSIONS.SHOP_SALES_VIEW, PERMISSIONS.SHOP_ORDERS_VIEW],
    icon: 'sales',
  },
  {
    href: '/users',
    labelKey: 'nav.staff',
    descriptionKey: 'nav.staffDesc',
    label: 'Staff',
    description: 'Manage shop staff accounts',
    permissions: [],
    adminOnly: true,
    icon: 'users',
  },
  {
    href: '/settings',
    labelKey: 'nav.settings',
    descriptionKey: 'nav.settingsDesc',
    label: 'Settings',
    description: 'Account and shop preferences',
    permissions: [],
    icon: 'settings',
  },
]

export function canSeeShopNavItem(
  permissions: string[] | undefined,
  item: ShopNavItem,
  role?: string
): boolean {
  if (item.adminOnly) return role === 'admin'
  if (!item.permissions.length) return true
  return hasPermission(permissions, item.permissions)
}

export function filterShopNavItems(
  permissions: string[] | undefined,
  role?: string
): ShopNavItem[] {
  return SHOP_NAV_ITEMS.filter((item) => canSeeShopNavItem(permissions, item, role))
}

export function canAccessShopPath(
  pathname: string,
  permissions: string[] | undefined,
  role?: string
): boolean {
  const item = SHOP_NAV_ITEMS.find(
    (entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`)
  )
  if (!item) return true
  return canSeeShopNavItem(permissions, item, role)
}

export function roleDisplayLabelKey(role: string): ShopMessageKey | null {
  const keys: Record<string, ShopMessageKey> = {
    admin: 'role.admin',
    salesperson: 'role.salesperson',
    inventory_manager: 'role.inventory_manager',
    support_staff: 'role.support_staff',
    engineer: 'role.engineer',
  }
  return keys[role] ?? null
}

/** English source label for server/tests; UI should prefer translated roleDisplayLabelKey. */
export function roleDisplayLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Administrator',
    salesperson: 'Salesperson',
    inventory_manager: 'Inventory Manager',
    support_staff: 'Support staff',
    engineer: 'Engineer',
  }
  return labels[role] ?? role.replace(/_/g, ' ')
}
