'use client'

import Link from 'next/link'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { COMPANY } from '@/lib/company/constants'
import { STOREFRONT_GUTTER } from '@/lib/shop/storefront-layout'
import { getDefaultStorefrontShop } from '@/lib/shop/storefront-shops'

export function StorefrontFooter() {
  const t = useShopT()
  const shop = getDefaultStorefrontShop()

  return (
    <footer className="mt-auto w-full border-t border-white/10 bg-[var(--shop-hero,#0e1f16)] text-white">
      <div className={`${STOREFRONT_GUTTER} grid gap-8 py-10 md:grid-cols-3`}>
        <div>
          <p className="text-sm font-semibold">{t('brand.short')}</p>
          <p className="mt-2 text-sm text-white/75">{t('storefront.footer.tagline')}</p>
        </div>
        <div className="text-sm text-white/80">
          <p className="font-semibold text-white">{shop.name}</p>
          <p className="mt-2">{COMPANY.phoneDisplay}</p>
          <p>{COMPANY.phoneAltDisplay}</p>
          <p>{COMPANY.email}</p>
          <Link href="/track" className="mt-3 inline-block text-white/80 hover:text-white">
            {t('storefront.nav.track')}
          </Link>
        </div>
        <div className="text-sm">
          <Link href="/login" className="inline-block text-white/55 hover:text-white/80">
            {t('storefront.footer.manage')}
          </Link>
        </div>
      </div>
    </footer>
  )
}
