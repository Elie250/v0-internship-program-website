'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import {
  StorefrontAddToCart,
  StorefrontAvailability,
} from '@/components/storefront/storefront-add-to-cart'
import { StorefrontProductCard } from '@/components/storefront/storefront-product-card'
import { formatShopRwf } from '@/lib/shop/format'
import {
  publicDiscountPercent,
  type PublicCatalogueItem,
} from '@/lib/shop/public-catalogue'
import { STOREFRONT_GUTTER } from '@/lib/shop/storefront-layout'
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

const LATEST_ROW =
  'mt-5 flex gap-2 overflow-x-auto pb-2 sm:gap-3 md:grid md:grid-cols-3 md:overflow-visible md:pb-0 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'

export function StorefrontMerchandising({
  merch,
  children,
}: {
  merch: StorefrontMerchandising
  children?: ReactNode
}) {
  const t = useShopT()

  return (
    <div className="bg-slate-50">
      {merch.deals.length > 0 ? (
        <section className="bg-amber-50">
          <div className={`${STOREFRONT_GUTTER} py-8`}>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {t('storefront.deals.title')}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{t('storefront.deals.subtitle')}</p>
            <div className={PRODUCT_GRID}>
              {merch.deals.map((product) => (
                <StorefrontProductCard key={product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {children}

      {merch.categoryTiles.length > 0 ? (
        <section className={`${STOREFRONT_GUTTER} pt-10`}>
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

      {merch.latestProducts.length > 0 ? (
        <section className={`${STOREFRONT_GUTTER} pt-10`}>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {t('storefront.latest.title')}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{t('storefront.latest.subtitle')}</p>
          <div className={LATEST_ROW}>
            {merch.latestProducts.map((product) => (
              <div
                key={product.slug}
                className="w-[11.5rem] shrink-0 sm:w-[13rem] md:w-auto md:min-w-0"
              >
                <StorefrontProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {merch.trends.length > 0 ? <StorefrontTrends products={merch.trends} /> : null}

      {merch.promos.length > 0 ? (
        <section className={`${STOREFRONT_GUTTER} pt-10`}>
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

function StorefrontTrends({ products }: { products: PublicCatalogueItem[] }) {
  const t = useShopT()
  const [featured, ...rest] = products
  if (!featured) return null
  const href = `/product/${encodeURIComponent(featured.slug)}`
  const percent = publicDiscountPercent(featured.listPrice, featured.price)

  return (
    <section className={`${STOREFRONT_GUTTER} pt-10`}>
      <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
        {t('storefront.trends.title')}
      </h2>
      <p className="mt-1 text-sm text-slate-600">{t('storefront.trends.subtitle')}</p>
      <article className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid lg:grid-cols-[1.15fr_0.85fr]">
        <Link href={href} className="relative block min-h-[220px] bg-slate-100 sm:min-h-[280px] lg:min-h-[360px]">
          {featured.image ? (
            <Image
              src={featured.image}
              alt={featured.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full min-h-[220px] items-center justify-center text-slate-300">
              <Package className="h-12 w-12" aria-hidden />
            </div>
          )}
          {percent ? (
            <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-[var(--brand-navy,#1e3a5f)]">
              −{percent}%
            </span>
          ) : null}
        </Link>
        <div className="flex flex-col justify-center p-5 sm:p-8">
          {featured.categoryName ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {featured.categoryName}
            </p>
          ) : null}
          <Link href={href}>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              {featured.name}
            </h3>
          </Link>
          <p className="mt-2 text-sm text-slate-500">{featured.sellingUnitLabel}</p>
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <p className="text-2xl font-semibold text-[var(--brand-navy,#1e3a5f)]">
              {formatShopRwf(featured.price)}
            </p>
            {featured.listPrice ? (
              <p className="text-sm text-slate-400 line-through">
                {formatShopRwf(featured.listPrice)}
              </p>
            ) : null}
          </div>
          <div className="mt-3">
            <StorefrontAvailability value={featured.availability} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <StorefrontAddToCart product={featured} className="min-w-[9rem]" />
            <Button asChild variant="outline" className="border-slate-300">
              <Link href={href}>{t('storefront.hero.viewProduct')}</Link>
            </Button>
          </div>
        </div>
      </article>
      {rest.length > 0 ? (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 sm:gap-3">
          {rest.map((product) => (
            <div
              key={product.slug}
              className="w-[11.5rem] shrink-0 sm:w-[13rem] md:w-[14.5rem]"
            >
              <StorefrontProductCard product={product} />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
