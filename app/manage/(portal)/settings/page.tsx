import type { Metadata } from 'next'
import { requireShopPortalAccess } from '@/lib/shop/portal-session'
import { roleDisplayLabel, SHOP_PORTAL_DISPLAY } from '@/lib/shop/portal-nav'
import {
  ShopPageHeader,
  ShopPlaceholderPanel,
} from '@/components/shop-portal/shop-page-chrome'

export const metadata: Metadata = {
  title: 'Settings | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default async function ShopSettingsPage() {
  const session = await requireShopPortalAccess('/settings', null)
  if (!session) return null

  const displayName =
    `${session.user.firstName} ${session.user.lastName}`.trim() || session.user.email

  return (
    <div>
      <ShopPageHeader
        title="Settings"
        description="Account and shop preferences. Advanced configuration will be added later."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ShopPlaceholderPanel
          title="Signed-in account"
          body={`${displayName} · ${session.user.email} · ${roleDisplayLabel(session.user.role)}`}
          phaseHint="Use Sign out in the sidebar or header to end your session"
        />
        <ShopPlaceholderPanel
          title="Operational context"
          body={`${SHOP_PORTAL_DISPLAY.brandName} — display label ${SHOP_PORTAL_DISPLAY.siteLabel}. This label is UI configuration only and does not change inventory accounting.`}
          phaseHint="Location data model is tracked separately from this shell"
        />
        <ShopPlaceholderPanel
          title="Shop preferences"
          body="User management, payment configuration, and EBM settings are not part of this shell phase."
          phaseHint="Future phases"
        />
      </div>
    </div>
  )
}
