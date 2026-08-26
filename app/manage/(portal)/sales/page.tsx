import type { Metadata } from 'next'
import { hasPermission, PERMISSIONS } from '@/lib/admin/permissions'
import { requireShopPortalAccess } from '@/lib/shop/portal-session'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import {
  ShopForbiddenPanel,
  ShopPageHeader,
} from '@/components/shop-portal/shop-page-chrome'
import { ShopSalesPanel } from '@/components/shop-portal/shop-sales-panel'

export const metadata: Metadata = {
  title: 'Sales | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default async function ShopSalesPage() {
  const session = await requireShopPortalAccess('/sales', STAFF_API_PERMISSIONS.orders)
  if (!session) {
    return (
      <div>
        <ShopPageHeader title="Sales" description="Sales and order history." />
        <ShopForbiddenPanel />
      </div>
    )
  }

  const canSeeUnitCost = hasPermission(session.user.permissions, [
    PERMISSIONS.SHOP_PRODUCTS,
    PERMISSIONS.SHOP_STOCK_ADJUST,
  ])

  return (
    <div>
      <ShopPageHeader
        title="Sales"
        description="POS and online order history from authorized staff order APIs."
      />
      <ShopSalesPanel canSeeUnitCost={canSeeUnitCost} />
    </div>
  )
}
