'use client'

import { SHOP_PORTAL_DISPLAY, type ShopNavItem } from '@/lib/shop/portal-nav'
import { ShopNav } from '@/components/shop-portal/shop-nav'
import { ShopLogoutButton } from '@/components/shop-portal/shop-logout-button'
import { ShopHeader } from '@/components/shop-portal/shop-header'
import { ShopLanguageSelector } from '@/components/shop-portal/shop-language-selector'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import type { ShopMessageKey } from '@/lib/shop/i18n/messages/en'

export function ShopShell({
  items,
  userLabel,
  roleLabelKey,
  roleLabelFallback,
  children,
}: {
  items: ShopNavItem[]
  userLabel: string
  roleLabelKey: ShopMessageKey | null
  roleLabelFallback: string
  children: React.ReactNode
}) {
  const t = useShopT()
  const roleLabel = roleLabelKey ? t(roleLabelKey) : roleLabelFallback

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-slate-200 px-4 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('brand.short')}
            </p>
            <p className="mt-1 text-base font-semibold text-[var(--brand-navy,#1e3a5f)]">
              {t('brand.name')}
            </p>
            <p className="text-xs text-slate-500">{t('brand.siteLabel')}</p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <ShopNav items={items} />
          </div>
          <div className="border-t border-slate-200 px-4 py-4 space-y-3">
            <ShopLanguageSelector compact />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{userLabel}</p>
              <p className="truncate text-xs text-slate-500">{roleLabel}</p>
            </div>
            <ShopLogoutButton />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <ShopHeader
            items={items}
            userLabel={userLabel}
            roleLabel={roleLabel}
          />
          <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}

/** Re-export for callers that still need the English display constants. */
export { SHOP_PORTAL_DISPLAY }
