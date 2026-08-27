import type { Metadata } from 'next'
import { requireShopPortalAccess } from '@/lib/shop/portal-session'
import { roleDisplayLabel, roleDisplayLabelKey } from '@/lib/shop/portal-nav'
import { ShopLocalizedPageHeader } from '@/components/shop-portal/shop-localized-page-header'
import { ShopSettingsPanel } from '@/components/shop-portal/shop-settings-panel'

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
      <ShopLocalizedPageHeader
        titleKey="settings.title"
        descriptionKey="settings.description"
      />
      <ShopSettingsPanel
        displayName={displayName}
        email={session.user.email}
        roleLabelKey={roleDisplayLabelKey(session.user.role)}
        roleLabelFallback={roleDisplayLabel(session.user.role)}
      />
    </div>
  )
}
