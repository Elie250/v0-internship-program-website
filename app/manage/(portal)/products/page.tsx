import type { Metadata } from 'next'
import { hasPermission, PERMISSIONS } from '@/lib/admin/permissions'
import { requireShopPortalAccess } from '@/lib/shop/portal-session'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import { ShopForbiddenPanel } from '@/components/shop-portal/shop-page-chrome'
import { ShopLocalizedPageHeader } from '@/components/shop-portal/shop-localized-page-header'
import { ShopProductsPanel } from '@/components/shop-portal/shop-products-panel'

export const metadata: Metadata = {
  title: 'Products | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default async function ShopProductsPage() {
  const session = await requireShopPortalAccess('/products', STAFF_API_PERMISSIONS.products)
  if (!session) {
    return (
      <div>
        <ShopLocalizedPageHeader
          titleKey="products.title"
          descriptionKey="products.descriptionForbidden"
        />
        <ShopForbiddenPanel />
      </div>
    )
  }

  const canSeeCost = hasPermission(session.user.permissions, PERMISSIONS.SHOP_PRODUCTS)

  return (
    <div>
      <ShopLocalizedPageHeader
        titleKey="products.title"
        descriptionKey="products.description"
      />
      <ShopProductsPanel canSeeCost={canSeeCost} />
    </div>
  )
}
