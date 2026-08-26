import type { Metadata } from 'next'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { requireShopPortalAccess } from '@/lib/shop/portal-session'
import {
  ShopForbiddenPanel,
  ShopPageHeader,
  ShopPlaceholderPanel,
} from '@/components/shop-portal/shop-page-chrome'

export const metadata: Metadata = {
  title: 'Products | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default async function ShopProductsPage() {
  const session = await requireShopPortalAccess('/products', PERMISSIONS.SHOP_PRODUCTS)
  if (!session) {
    return (
      <div>
        <ShopPageHeader title="Products" description="Product catalog." />
        <ShopForbiddenPanel />
      </div>
    )
  }

  return (
    <div>
      <ShopPageHeader
        title="Products"
        description="Manage the Energy & Logics product catalog. Catalog APIs and editing tools arrive after the staff API phase."
      />
      <ShopPlaceholderPanel
        title="Catalog management coming soon"
        body="Product listing, pricing, and images will use the existing products backend — not a second catalog."
        phaseHint="Available after Phase 1C.5 / 1C.8"
      />
    </div>
  )
}
