'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { formatShopRwf } from '@/lib/shop/format'
import type { PublicCatalogueItem } from '@/lib/shop/public-catalogue'

export function StorefrontHome({ hero }: { hero?: PublicCatalogueItem | null }) {
  const t = useShopT()
  const href = hero ? `/product/${encodeURIComponent(hero.slug)}` : '#products'

  return (
    <section className="relative overflow-hidden bg-[var(--brand-navy,#1e3a5f)] text-white">
      <div className="relative mx-auto grid max-w-6xl items-stretch gap-0 lg:grid-cols-2">
        <div className="relative z-10 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
            {t('storefront.hero.eyebrow')}
          </p>
          <p className="mt-2 text-sm font-medium text-amber-200">{t('brand.siteLabel')}</p>
          {hero ? (
            <>
              <h1 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                {hero.name}
              </h1>
              <p className="mt-4 text-2xl font-semibold text-white">{formatShopRwf(hero.price)}</p>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
                {t('storefront.hero.nowAt')}
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {t('storefront.hero.title')}
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
                {t('storefront.hero.body')}
              </p>
            </>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-white text-[var(--brand-navy,#1e3a5f)] hover:bg-white/90">
              <Link href={href}>
                {hero ? t('storefront.hero.viewProduct') : t('storefront.hero.browse')}
              </Link>
            </Button>
            {hero ? (
              <Button
                asChild
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="#products">{t('storefront.hero.browse')}</Link>
              </Button>
            ) : null}
          </div>
        </div>
        <div className="relative min-h-[240px] bg-[var(--brand-navy-deep,#152a45)] lg:min-h-full">
          {hero?.image ? (
            <Image
              src={hero.image}
              alt={hero.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              unoptimized
            />
          ) : (
            <div
              className="absolute inset-0 opacity-[0.15]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
              aria-hidden
            />
          )}
          <div
            className="absolute inset-0 bg-gradient-to-t from-[var(--brand-navy,#1e3a5f)]/70 to-transparent lg:bg-gradient-to-l"
            aria-hidden
          />
        </div>
      </div>
    </section>
  )
}
