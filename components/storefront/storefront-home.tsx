'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'

export function StorefrontHome() {
  const t = useShopT()

  return (
    <section className="relative overflow-hidden bg-[var(--brand-navy,#1e3a5f)] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
          {t('storefront.hero.eyebrow')}
        </p>
        <p className="mt-2 text-sm font-medium text-amber-200">{t('brand.siteLabel')}</p>
        <h1 className="mt-3 max-w-3xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
          {t('storefront.hero.title')}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
          {t('storefront.hero.body')}
        </p>
        <div className="mt-6">
          <Button asChild className="bg-white text-[var(--brand-navy,#1e3a5f)] hover:bg-white/90">
            <Link href="#products">{t('storefront.hero.browse')}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
