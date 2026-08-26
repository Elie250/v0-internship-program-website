import type { Metadata } from 'next'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { requireShopPortalAccess } from '@/lib/shop/portal-session'
import {
  ShopForbiddenPanel,
  ShopPageHeader,
} from '@/components/shop-portal/shop-page-chrome'
import { ShopPosTerminal } from '@/components/shop-portal/shop-pos-terminal'

export const metadata: Metadata = {
  title: 'POS | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default async function ShopPosPage() {
  const session = await requireShopPortalAccess('/pos', PERMISSIONS.SHOP_POS_SELL)
  if (!session) {
    return (
      <div>
        <ShopPageHeader title="POS" description="Point of sale terminal." />
        <ShopForbiddenPanel />
      </div>
    )
  }

  return (
    <div>
      <ShopPageHeader
        title="POS"
        description="Cash point of sale. Product lookup and checkout use staff APIs; the server owns pricing, stock, and receipts."
      />
      <ShopPosTerminal />
    </div>
  )
}
