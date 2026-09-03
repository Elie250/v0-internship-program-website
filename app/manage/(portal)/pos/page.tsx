import type { Metadata } from 'next'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { requireShopPortalAccess } from '@/lib/shop/portal-session'
import { ShopForbiddenPanel } from '@/components/shop-portal/shop-page-chrome'
import { ShopLocalizedPageHeader } from '@/components/shop-portal/shop-localized-page-header'
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
        <ShopLocalizedPageHeader
          titleKey="pos.title"
          descriptionKey="pos.descriptionForbidden"
        />
        <ShopForbiddenPanel />
      </div>
    )
  }

  return (
    <div>
      <ShopLocalizedPageHeader titleKey="pos.title" descriptionKey="pos.description" />
      <ShopPosTerminal />
    </div>
  )
}
