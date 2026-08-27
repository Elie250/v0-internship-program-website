'use client'

import Link from 'next/link'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'

export function StorefrontHome() {
  const t = useShopT()

  return (
    <>
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
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
              {t('storefront.hero.eyebrow')}
            </p>
            <h1 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {t('storefront.hero.title')}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg">
              {t('storefront.hero.body')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                className="bg-white text-[var(--brand-navy,#1e3a5f)] hover:bg-white/90"
              >
                <Link href="#products">{t('storefront.hero.browse')}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/track">{t('storefront.nav.track')}</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              {t('storefront.shoppingFrom')}
            </p>
            <p className="mt-2 text-2xl font-semibold">{t('brand.siteLabel')}</p>
            <p className="mt-4 text-sm leading-relaxed text-white/80">
              {t('storefront.catalogue.hint')}
            </p>
          </div>
        </div>
      </section>

      <section id="products" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {t('storefront.catalogue.title')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
            {t('storefront.catalogue.hint')}
          </p>
        </div>
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-400" aria-hidden />
          <p className="mt-4 text-sm font-medium text-slate-700">{t('storefront.catalogue.soon')}</p>
        </div>
      </section>
    </>
  )
}
