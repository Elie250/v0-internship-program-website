import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { ShopI18nProvider } from '@/components/shop-portal/shop-i18n-provider'
import { StorefrontShell } from '@/components/storefront/storefront-shell'
import { isCurrentRequestShopHost } from '@/lib/shop/portal-session'
import { readStorefrontLocale } from '@/lib/shop/storefront-locale'
import {
  getAvailableStorefrontShops,
  getDefaultStorefrontShop,
} from '@/lib/shop/storefront-shops'

export const metadata: Metadata = {
  title: 'Energy & Logics Shop',
  description: 'Electrical and electronic supplies from Energy & Logics — Nyanza Shop.',
  robots: { index: true, follow: true },
}

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const onShopHost = await isCurrentRequestShopHost()
  if (!onShopHost) {
    redirect('/shop')
  }

  const initialLocale = await readStorefrontLocale()
  const shops = getAvailableStorefrontShops()
  const currentShop = getDefaultStorefrontShop()

  return (
    <ShopI18nProvider initialLocale={initialLocale}>
      <StorefrontShell shops={shops} currentShopCode={currentShop.code}>
        {children}
      </StorefrontShell>
    </ShopI18nProvider>
  )
}
