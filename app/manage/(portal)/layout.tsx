import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  isCurrentRequestShopHost,
  requireShopPortalSession,
} from '@/lib/shop/portal-session'
import {
  filterShopNavItems,
  roleDisplayLabel,
  roleDisplayLabelKey,
} from '@/lib/shop/portal-nav'
import { ShopShell } from '@/components/shop-portal/shop-shell'
import { ShopI18nProvider } from '@/components/shop-portal/shop-i18n-provider'
import {
  SHOP_DEFAULT_LOCALE,
  SHOP_LOCALE_COOKIE,
  isShopLocale,
  type ShopLocale,
} from '@/lib/shop/i18n/locales'

async function readInitialShopLocale(): Promise<ShopLocale> {
  const jar = await cookies()
  const raw = jar.get(SHOP_LOCALE_COOKIE)?.value
  return isShopLocale(raw) ? raw : SHOP_DEFAULT_LOCALE
}

export default async function ShopPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const onShopHost = await isCurrentRequestShopHost()
  if (!onShopHost) {
    redirect('/')
  }

  const session = await requireShopPortalSession('/dashboard')
  const items = filterShopNavItems(session.user.permissions, session.user.role)
  const userLabel =
    [session.user.firstName, session.user.lastName].filter(Boolean).join(' ').trim() ||
    session.user.email
  const initialLocale = await readInitialShopLocale()

  return (
    <ShopI18nProvider initialLocale={initialLocale}>
      <ShopShell
        items={items}
        userLabel={userLabel}
        roleLabelKey={roleDisplayLabelKey(session.user.role)}
        roleLabelFallback={roleDisplayLabel(session.user.role)}
      >
        {children}
      </ShopShell>
    </ShopI18nProvider>
  )
}
