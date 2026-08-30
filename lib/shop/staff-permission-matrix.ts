import { getPermissionsForRole, PERMISSIONS, type Permission } from '@/lib/admin/permissions'
import type { ShopMessageKey } from '@/lib/shop/i18n/messages/en'

export type ShopStaffPermissionGroup = {
  id: string
  labelKey: ShopMessageKey
  keys: Permission[]
}

export const SHOP_STAFF_PERMISSION_MATRIX: ShopStaffPermissionGroup[] = [
  {
    id: 'product',
    labelKey: 'staff.perms.group.product',
    keys: [PERMISSIONS.SHOP_PRODUCTS, PERMISSIONS.SHOP_PRODUCTS_VIEW],
  },
  {
    id: 'pos',
    labelKey: 'staff.perms.group.pos',
    keys: [
      PERMISSIONS.SHOP_POS_SELL,
      PERMISSIONS.SHOP_SALES_VIEW,
      PERMISSIONS.SHOP_ORDERS_VIEW,
      PERMISSIONS.SHOP_ORDERS_MANAGE,
    ],
  },
  {
    id: 'inventory',
    labelKey: 'staff.perms.group.inventory',
    keys: [
      PERMISSIONS.SHOP_STOCK_VIEW,
      PERMISSIONS.SHOP_STOCK_ADJUST,
      PERMISSIONS.SHOP_STOCK_RECEIVE,
    ],
  },
  {
    id: 'pricing',
    labelKey: 'staff.perms.group.pricing',
    keys: [PERMISSIONS.SHOP_COST_PRICE, PERMISSIONS.SHOP_SELLING_PRICE],
  },
  {
    id: 'replenishment',
    labelKey: 'staff.perms.group.replenishment',
    keys: [PERMISSIONS.SHOP_REPLENISHMENT_VIEW, PERMISSIONS.SHOP_PURCHASE_REQUEST],
  },
]

export const SHOP_STAFF_PERMISSION_LABELS: Record<string, ShopMessageKey> = {
  [PERMISSIONS.SHOP_PRODUCTS]: 'staff.perms.products',
  [PERMISSIONS.SHOP_PRODUCTS_VIEW]: 'staff.perms.productsView',
  [PERMISSIONS.SHOP_POS_SELL]: 'staff.perms.pos',
  [PERMISSIONS.SHOP_SALES_VIEW]: 'staff.perms.salesView',
  [PERMISSIONS.SHOP_ORDERS_VIEW]: 'staff.perms.ordersView',
  [PERMISSIONS.SHOP_ORDERS_MANAGE]: 'staff.perms.ordersManage',
  [PERMISSIONS.SHOP_STOCK_VIEW]: 'staff.perms.stockView',
  [PERMISSIONS.SHOP_STOCK_ADJUST]: 'staff.perms.stockAdjust',
  [PERMISSIONS.SHOP_STOCK_RECEIVE]: 'staff.perms.stockReceive',
  [PERMISSIONS.SHOP_COST_PRICE]: 'staff.perms.costPrice',
  [PERMISSIONS.SHOP_SELLING_PRICE]: 'staff.perms.sellingPrice',
  [PERMISSIONS.SHOP_REPLENISHMENT_VIEW]: 'staff.perms.replenishmentView',
  [PERMISSIONS.SHOP_PURCHASE_REQUEST]: 'staff.perms.purchaseRequest',
}

export function roleDefaultPermissionSet(role: string): Set<string> {
  return new Set(getPermissionsForRole(role))
}

export function extrasFromCheckedKeys(role: string, checked: string[]): Permission[] {
  const defaults = roleDefaultPermissionSet(role)
  return checked.filter((key): key is Permission => !defaults.has(key)) as Permission[]
}
