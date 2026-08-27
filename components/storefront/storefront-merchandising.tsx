'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { StorefrontProductCard } from '@/components/storefront/storefront-product-card'
import type { StorefrontMerchandising, StorefrontPromoKind } from '@/lib/shop/public-merchandising'
import type { ShopMessageKey } from '@/lib/shop/i18n/messages/en'

const PROMO_COPY: Record<
  StorefrontPromoKind,
  { title: ShopMessageKey; body: ShopMessageKey }
> = {
  sound: {
    title: 'storefront.promo.sound.title',
    body: 'storefront.promo.sound.body',
  },
  power: {
    title: 'storefront.promo.power.title',
    body: 'storefront.promo.power.body',
  },
}

const PRODUCT_GRID =
  'mt-5 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'

export function StorefrontMerchandising({ merch }: { merch: StorefrontMerchandising }) {
  const t = useShopT()

  return (
    <div className="bg-slate-50">
      {merch.deals.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {t('storefront.deals.title')}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{t('storefront.deals.subtitle')}</p>
          <div className={PRODUCT_GRID}>
            {merch.deals.map((product) => (
              <StorefrontProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {merch.categoryTiles.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {t('storefront.categories.title')}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {merch.categoryTiles.map((category) => (
              <Link
                key={category.slug}
                href={`/?category=${encodeURIComponent(category.slug)}`}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="relative aspect-[5/3] bg-slate-100">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <Package className="h-8 w-8" aria-hidden />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                  <p className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white">
                    {category.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {merch.newArrivals.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                {t('storefront.arrivals.title')}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{t('storefront.arrivals.subtitle')}</p>
            </div>
            <Button asChild variant="outline" className="hidden border-slate-300 sm:inline-flex">
              <Link href="#products">{t('storefront.hero.browse')}</Link>
            </Button>
          </div>
          <div className={PRODUCT_GRID}>
            {merch.newArrivals.map((product) => (
              <StorefrontProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {merch.promos.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
          <div className={`grid gap-4 ${merch.promos.length > 1 ? 'md:grid-cols-2' : ''}`}>
            {merch.promos.map((promo) => (
              <Link
                key={promo.kind}
                href={`/?category=${encodeURIComponent(promo.categorySlug)}`}
                className="group relative min-h-[200px] overflow-hidden rounded-2xl bg-[var(--brand-navy,#1e3a5f)] text-white"
              >
                {promo.image ? (
                  <Image
                    src={promo.image}
                    alt={promo.categoryName}
                    fill
                    className="object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
                <div className="relative flex h-full min-h-[200px] flex-col justify-end p-6 sm:p-8">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {t(PROMO_COPY[promo.kind].title)}
                  </h2>
                  <p className="mt-2 max-w-sm text-sm text-white/85">
                    {t(PROMO_COPY[promo.kind].body)}
                  </p>
                  <p className="mt-4 text-sm font-semibold text-amber-300">
                    {t('storefront.promo.shop')} · {promo.categoryName}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
