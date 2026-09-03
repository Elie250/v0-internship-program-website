import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { ShopLoginScreen } from '@/components/shop-portal/shop-login-screen'
import { ShopI18nProvider } from '@/components/shop-portal/shop-i18n-provider'
import {
  getShopPortalSession,
  isCurrentRequestShopHost,
} from '@/lib/shop/portal-session'
import { sanitizeShopReturnPath } from '@/lib/shop/safe-return-path'
import {
  SHOP_DEFAULT_LOCALE,
  SHOP_LOCALE_COOKIE,
  isShopLocale,
} from '@/lib/shop/i18n/locales'

export const metadata: Metadata = {
  title: 'Staff Sign In | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default async function ShopManageLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const onShopHost = await isCurrentRequestShopHost()
  if (!onShopHost) {
    redirect('/auth/login')
  }

  const session = await getShopPortalSession()
  const params = await searchParams
  const rawReturn =
    typeof params.returnTo === 'string'
      ? params.returnTo
      : Array.isArray(params.returnTo)
        ? params.returnTo[0]
        : undefined
  const returnTo = sanitizeShopReturnPath(rawReturn)

  if (session) {
    redirect(returnTo)
  }

  const jar = await cookies()
  const rawLocale = jar.get(SHOP_LOCALE_COOKIE)?.value
  const initialLocale = isShopLocale(rawLocale) ? rawLocale : SHOP_DEFAULT_LOCALE

  return (
    <ShopI18nProvider initialLocale={initialLocale}>
      <ShopLoginScreen />
    </ShopI18nProvider>
  )
}
