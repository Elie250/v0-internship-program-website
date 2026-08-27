import type { Metadata } from 'next'
import { hasPermission, PERMISSIONS } from '@/lib/admin/permissions'
import { requireShopPortalAccess } from '@/lib/shop/portal-session'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import { getStaffDashboardReport } from '@/lib/shop/staff-api/dashboard'
import { ShopLocalizedPageHeader } from '@/components/shop-portal/shop-localized-page-header'
import { ShopDashboardView } from '@/components/shop-portal/shop-dashboard'

export const metadata: Metadata = {
  title: 'Dashboard | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

/**
 * Shop management dashboard.
 * Metrics come from the same server report as GET /api/staff/reports/dashboard
 * (shared getStaffDashboardReport — no client-side commerce math).
 */
export default async function ShopDashboardPage() {
  const session = await requireShopPortalAccess('/dashboard', null)
  const permissions = session?.user.permissions

  const showSales = hasPermission(permissions, STAFF_API_PERMISSIONS.dashboard)
  const showStock = hasPermission(permissions, PERMISSIONS.SHOP_STOCK_VIEW)
  const canOpenPos = hasPermission(permissions, PERMISSIONS.SHOP_POS_SELL)
  const canOpenSales = hasPermission(permissions, STAFF_API_PERMISSIONS.orders)
  const canOpenInventory = hasPermission(permissions, PERMISSIONS.SHOP_STOCK_VIEW)

  let report = null
  let loadError: string | null = null

  if (showSales || showStock) {
    const result = await getStaffDashboardReport()
    if (!('body' in result)) {
      loadError = result.error
    } else {
      report = result.body
    }
  }

  return (
    <div>
      <ShopLocalizedPageHeader
        titleKey="dashboard.title"
        descriptionKey="dashboard.description"
        descriptionParamKeys={{ siteLabel: 'brand.siteLabel' }}
      />
      <ShopDashboardView
        report={report}
        showSales={showSales}
        showStock={showStock}
        canOpenPos={canOpenPos}
        canOpenSales={canOpenSales}
        canOpenInventory={canOpenInventory}
        loadError={loadError}
      />
    </div>
  )
}
