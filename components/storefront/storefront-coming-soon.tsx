'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import type { ShopMessageKey } from '@/lib/shop/i18n/messages/en'

export function StorefrontComingSoon({
  titleKey,
  bodyKey,
}: {
  titleKey: ShopMessageKey
  bodyKey: ShopMessageKey
}) {
  const t = useShopT()

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy,#1e3a5f)]">
        {t('storefront.comingSoon')}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {t(titleKey)}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-slate-600">{t(bodyKey)}</p>
      <Button
        asChild
        className="mt-8 bg-[var(--brand-navy,#1e3a5f)] text-white hover:bg-[var(--brand-navy,#1e3a5f)]/90"
      >
        <Link href="/">{t('storefront.cart.continue')}</Link>
      </Button>
    </section>
  )
}
