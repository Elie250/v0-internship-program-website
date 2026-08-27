'use client'

import Link from 'next/link'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { COMPANY } from '@/lib/company/constants'
import { getDefaultStorefrontShop } from '@/lib/shop/storefront-shops'

export function StorefrontFooter() {
  const t = useShopT()
  const shop = getDefaultStorefrontShop()

  return (
    <footer className="mt-auto border-t border-white/10 bg-[var(--brand-navy-deep,#152a45)] text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-sm font-semibold">{t('brand.short')}</p>
          <p className="mt-2 text-sm text-white/75">{t('storefront.footer.tagline')}</p>
        </div>
        <div className="text-sm text-white/80">
          <p className="font-semibold text-white">{shop.name}</p>
          <p className="mt-2">{COMPANY.phoneDisplay}</p>
          <p>{COMPANY.email}</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">{t('storefront.staff')}</p>
          <Link href="/login" className="mt-2 inline-block text-white/80 hover:text-white">
            {t('storefront.footer.manage')}
          </Link>
        </div>
      </div>
    </footer>
  )
}
