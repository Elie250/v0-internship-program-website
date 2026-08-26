import type { Metadata } from 'next'
import { requireShopPortalAccess } from '@/lib/shop/portal-session'
import {
  ShopPageHeader,
  ShopPlaceholderPanel,
} from '@/components/shop-portal/shop-page-chrome'

export const metadata: Metadata = {
  title: 'Dashboard | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default async function ShopDashboardPage() {
  await requireShopPortalAccess('/dashboard', null)

  return (
    <div>
      <ShopPageHeader
        title="Dashboard"
        description="Operational overview for the Energy & Logics Shop. Live metrics will be provided by server-side reports in a later phase."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Today's sales", hint: 'Available in Phase 1C.6' },
          { title: 'Orders', hint: 'Available in Phase 1C.6' },
          { title: 'Stock', hint: 'Available in Phase 1C.6' },
          { title: 'Profit', hint: 'Available in Phase 1C.6' },
        ].map((card) => (
          <ShopPlaceholderPanel
            key={card.title}
            title={card.title}
            body="No fabricated figures are shown here. Values will come from authorized staff report APIs."
            phaseHint={card.hint}
          />
        ))}
      </div>
    </div>
  )
}
