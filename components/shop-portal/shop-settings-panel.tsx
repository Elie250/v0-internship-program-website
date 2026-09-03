'use client'

import { ShopPlaceholderPanel } from '@/components/shop-portal/shop-page-chrome'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import type { ShopMessageKey } from '@/lib/shop/i18n/messages/en'

export function ShopSettingsPanel({
  displayName,
  email,
  roleLabelKey,
  roleLabelFallback,
}: {
  displayName: string
  email: string
  roleLabelKey: ShopMessageKey | null
  roleLabelFallback: string
}) {
  const t = useShopT()
  const roleLabel = roleLabelKey ? t(roleLabelKey) : roleLabelFallback

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ShopPlaceholderPanel
        title={t('settings.account.title')}
        body={`${displayName} · ${email} · ${roleLabel}`}
        phaseHint={t('settings.account.phaseHint')}
      />
      <ShopPlaceholderPanel
        title={t('settings.context.title')}
        body={t('settings.context.body', {
          brandName: t('brand.name'),
          siteLabel: t('brand.siteLabel'),
        })}
        phaseHint={t('settings.context.phaseHint')}
      />
      <ShopPlaceholderPanel
        title={t('settings.prefs.title')}
        body={t('settings.prefs.body')}
        phaseHint={t('settings.prefs.phaseHint')}
      />
    </div>
  )
}
