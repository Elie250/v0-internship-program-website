import type { Metadata } from 'next'
import { hasPermission, PERMISSIONS } from '@/lib/admin/permissions'
import { requireShopPortalAccess } from '@/lib/shop/portal-session'
import { ShopForbiddenPanel } from '@/components/shop-portal/shop-page-chrome'
import { ShopLocalizedPageHeader } from '@/components/shop-portal/shop-localized-page-header'
import { ShopInventoryPanel } from '@/components/shop-portal/shop-inventory-panel'

export const metadata: Metadata = {
  title: 'Inventory | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default async function ShopInventoryPage() {
  const session = await requireShopPortalAccess('/inventory', PERMISSIONS.SHOP_STOCK_VIEW)
  if (!session) {
    return (
      <div>
        <ShopLocalizedPageHeader
          titleKey="inventory.title"
          descriptionKey="inventory.descriptionForbidden"
        />
        <ShopForbiddenPanel />
      </div>
    )
  }

  return (
    <div>
      <ShopLocalizedPageHeader
        titleKey="inventory.title"
        descriptionKey="inventory.description"
      />
      <ShopInventoryPanel
        canAdjust={hasPermission(session.user.permissions, PERMISSIONS.SHOP_STOCK_ADJUST)}
        canReceive={hasPermission(session.user.permissions, PERMISSIONS.SHOP_STOCK_RECEIVE)}
        canReplenish={hasPermission(session.user.permissions, PERMISSIONS.SHOP_REPLENISHMENT_VIEW)}
        canPurchaseRequest={hasPermission(session.user.permissions, PERMISSIONS.SHOP_PURCHASE_REQUEST)}
      />
    </div>
  )
}
