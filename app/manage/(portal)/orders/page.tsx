import type { Metadata } from 'next'
import { hasPermission, PERMISSIONS } from '@/lib/admin/permissions'
import { requireShopPortalAccess } from '@/lib/shop/portal-session'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import { ShopForbiddenPanel } from '@/components/shop-portal/shop-page-chrome'
import { ShopLocalizedPageHeader } from '@/components/shop-portal/shop-localized-page-header'
import { ShopOrdersPanel } from '@/components/shop-portal/shop-orders-panel'

export const metadata: Metadata = {
  title: 'Orders | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default async function ShopOrdersPage() {
  const session = await requireShopPortalAccess('/orders', PERMISSIONS.SHOP_ORDERS_VIEW)
  if (!session) {
    return (
      <div>
        <ShopLocalizedPageHeader
          titleKey="orders.title"
          descriptionKey="orders.descriptionForbidden"
        />
        <ShopForbiddenPanel />
      </div>
    )
  }

  const canReviewPayments = hasPermission(
    session.user.permissions,
    STAFF_API_PERMISSIONS.paymentReview
  )
  const canManageFulfillment = hasPermission(
    session.user.permissions,
    STAFF_API_PERMISSIONS.fulfillment
  )

  return (
    <div>
      <ShopLocalizedPageHeader titleKey="orders.title" descriptionKey="orders.description" />
      <ShopOrdersPanel
        canReviewPayments={canReviewPayments}
        canManageFulfillment={canManageFulfillment}
      />
    </div>
  )
}
