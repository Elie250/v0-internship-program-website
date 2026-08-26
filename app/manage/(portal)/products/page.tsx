import type { Metadata } from 'next'
import { hasPermission, PERMISSIONS } from '@/lib/admin/permissions'
import { requireShopPortalAccess } from '@/lib/shop/portal-session'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import {
  ShopForbiddenPanel,
  ShopPageHeader,
} from '@/components/shop-portal/shop-page-chrome'
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
        <ShopPageHeader title="Products" description="Product catalog." />
        <ShopForbiddenPanel />
      </div>
    )
  }

  const canSeeCost = hasPermission(session.user.permissions, PERMISSIONS.SHOP_PRODUCTS)

  return (
    <div>
      <ShopPageHeader
        title="Products"
        description="Browse the Energy & Logics catalog. Data comes from authorized staff product APIs."
      />
      <ShopProductsPanel canSeeCost={canSeeCost} />
    </div>
  )
}
