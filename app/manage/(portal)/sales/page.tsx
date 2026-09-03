import type { Metadata } from 'next'
import { hasPermission, PERMISSIONS } from '@/lib/admin/permissions'
import { requireShopPortalAccess } from '@/lib/shop/portal-session'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import { ShopForbiddenPanel } from '@/components/shop-portal/shop-page-chrome'
import { ShopLocalizedPageHeader } from '@/components/shop-portal/shop-localized-page-header'
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
        <ShopLocalizedPageHeader
          titleKey="sales.title"
          descriptionKey="sales.descriptionForbidden"
        />
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
      <ShopLocalizedPageHeader titleKey="sales.title" descriptionKey="sales.description" />
      <ShopSalesPanel canSeeUnitCost={canSeeUnitCost} />
    </div>
  )
}
