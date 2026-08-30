import { hasPermission, PERMISSIONS, type Permission } from '@/lib/admin/permissions'

/** Cost / unit-cost may be returned only with shop:cost_price. */
export function canViewStaffProductCost(permissions: Permission[] | string[] | undefined): boolean {
  return hasPermission(permissions as Permission[] | undefined, PERMISSIONS.SHOP_COST_PRICE)
}

export function stripProductCostFields<T extends { costPrice?: unknown }>(
  item: T
): Omit<T, 'costPrice'> {
  const { costPrice: _costPrice, ...rest } = item
  return rest
}

export function stripOrderLineCostFields<T extends { unitCost?: unknown }>(
  item: T
): Omit<T, 'unitCost'> {
  const { unitCost: _unitCost, ...rest } = item
  return rest
}
