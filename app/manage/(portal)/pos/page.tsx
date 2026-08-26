import type { Metadata } from 'next'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { requireShopPortalAccess } from '@/lib/shop/portal-session'
import {
  ShopForbiddenPanel,
  ShopPageHeader,
  ShopPlaceholderPanel,
} from '@/components/shop-portal/shop-page-chrome'

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
        description="In-store point of sale for Energy & Logics. Checkout, payments, and receipts will be wired to the hardened commerce services in Phase 1C.7."
      />
      <ShopPlaceholderPanel
        title="Terminal coming soon"
        body="Product search, cart, cash/MoMo checkout, and receipts are not implemented in this shell phase."
        phaseHint="Available in Phase 1C.7"
      />
    </div>
  )
}
