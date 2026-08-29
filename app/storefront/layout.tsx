import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'
import { ShopI18nProvider } from '@/components/shop-portal/shop-i18n-provider'
import { StorefrontShell } from '@/components/storefront/storefront-shell'
import { isCurrentRequestShopHost } from '@/lib/shop/portal-session'
import { readStorefrontLocale } from '@/lib/shop/storefront-locale'
import {
  getAvailableStorefrontShops,
  getDefaultStorefrontShop,
} from '@/lib/shop/storefront-shops'
import { ShopCartProvider, STOREFRONT_CART_STORAGE_KEY } from '@/lib/shop/cart-context'

const shopSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Energy & Logics Shop',
  description: 'Electronics, accessories and practical technology from Energy & Logics — Nyanza Shop.',
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
      <ShopCartProvider storageKey={STOREFRONT_CART_STORAGE_KEY}>
        <StorefrontShell
          shops={shops}
          currentShopCode={currentShop.code}
          className={shopSans.className}
        >
          {children}
        </StorefrontShell>
      </ShopCartProvider>
    </ShopI18nProvider>
  )
}
