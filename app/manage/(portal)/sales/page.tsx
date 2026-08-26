import type { Metadata } from 'next'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { requireShopPortalAccess } from '@/lib/shop/portal-session'
import {
  ShopForbiddenPanel,
  ShopPageHeader,
  ShopPlaceholderPanel,
} from '@/components/shop-portal/shop-page-chrome'

export const metadata: Metadata = {
  title: 'Sales | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default async function ShopSalesPage() {
  const session = await requireShopPortalAccess('/sales', [
    PERMISSIONS.SHOP_SALES_VIEW,
    PERMISSIONS.SHOP_ORDERS_VIEW,
  ])
  if (!session) {
    return (
      <div>
        <ShopPageHeader title="Sales" description="Sales and order history." />
        <ShopForbiddenPanel />
      </div>
    )
  }

  return (
    <div>
      <ShopPageHeader
        title="Sales"
        description="Review POS and online sales once staff order APIs are available."
      />
      <ShopPlaceholderPanel
        title="Sales history coming soon"
        body="Order lists and detail views will call authorized staff APIs built on the existing commerce orders model."
        phaseHint="Available after Phase 1C.5 / 1C.8"
      />
    </div>
  )
}
