import type { Metadata } from 'next'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { requireShopPortalAccess } from '@/lib/shop/portal-session'
import {
  ShopForbiddenPanel,
  ShopPageHeader,
} from '@/components/shop-portal/shop-page-chrome'
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
        <ShopPageHeader title="Inventory" description="Stock levels and movements." />
        <ShopForbiddenPanel />
      </div>
    )
  }

  return (
    <div>
      <ShopPageHeader
        title="Inventory"
        description="Global stock levels and movement ledger from staff inventory APIs."
      />
      <ShopInventoryPanel />
    </div>
  )
}
