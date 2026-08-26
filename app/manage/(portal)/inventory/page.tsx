import type { Metadata } from 'next'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { requireShopPortalAccess } from '@/lib/shop/portal-session'
import {
  ShopForbiddenPanel,
  ShopPageHeader,
  ShopPlaceholderPanel,
} from '@/components/shop-portal/shop-page-chrome'

export const metadata: Metadata = {
  title: 'Inventory | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default async function ShopInventoryPage() {
  const session = await requireShopPortalAccess('/inventory', PERMISSIONS.SHOP_STOCK_VIEW)
  if (!session) {
    return (
      <div>
        <ShopPageHeader title="Inventory" description="Stock levels and movements." />
        <ShopForbiddenPanel />
      </div>
    )
  }

  return (
    <div>
      <ShopPageHeader
        title="Inventory"
        description="View stock using the existing products.stock source of truth. Adjustments and movements will use the hardened stock services."
      />
      <ShopPlaceholderPanel
        title="Inventory tools coming soon"
        body="Stock lists, adjustments, and movement history are not available in this shell. Location-aware stock is not part of this phase."
        phaseHint="Available after Phase 1C.5 / 1C.8"
      />
    </div>
  )
}
