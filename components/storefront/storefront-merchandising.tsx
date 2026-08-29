'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package } from 'lucide-react'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { StorefrontProductCard } from '@/components/storefront/storefront-product-card'
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
  'mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'

function SectionHead({
  title,
  href,
}: {
  title: string
  href?: string
}) {
  const t = useShopT()
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold tracking-tight text-[var(--shop-text)]">{title}</h2>
      {href ? (
        <Link href={href} className="text-sm font-semibold text-[var(--shop-green)]">
          {t('storefront.seeAll')}
        </Link>
      ) : null}
    </div>
  )
}

export function StorefrontMerchandising({
  merch,
  children,
}: {
  merch: StorefrontMerchandising
  children?: ReactNode
}) {
  const t = useShopT()

  return (
    <div className="bg-[var(--shop-bg)]">
      {children}

      {merch.categoryTiles.length > 0 ? (
        <section className={`${STOREFRONT_GUTTER} pt-6`}>
          <SectionHead title={t('storefront.categories.title')} href="/#products" />
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-6 md:overflow-visible xl:grid-cols-8">
            {merch.categoryTiles.map((category) => (
              <Link
                key={category.slug}
                href={`/?category=${encodeURIComponent(category.slug)}`}
                className="flex w-[88px] shrink-0 flex-col gap-1.5 md:w-auto"
              >
                <div className="relative flex h-[72px] items-center justify-center overflow-hidden rounded-[var(--shop-radius-md)] bg-[var(--shop-tile)]">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-contain p-2"
                      unoptimized
                    />
                  ) : (
                    <Package className="h-5 w-5 text-[var(--shop-muted)]" aria-hidden />
                  )}
                </div>
                <p className="line-clamp-2 text-center text-[11px] font-medium leading-[14px] text-[var(--shop-text)]">
                  {category.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {merch.latestProducts.length > 0 ? (
        <section className={`${STOREFRONT_GUTTER} pt-6`}>
          <SectionHead title={t('storefront.latest.title')} href="/#products" />
          <div className={PRODUCT_GRID}>
            {merch.latestProducts.map((product) => (
              <StorefrontProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {merch.deals.length > 0 ? (
        <section className={`${STOREFRONT_GUTTER} pt-6`}>
          <SectionHead title={t('storefront.deals.title')} href="/#products" />
          <div className={PRODUCT_GRID}>
            {merch.deals.map((product) => (
              <StorefrontProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {merch.trends.length > 0 ? (
        <section className={`${STOREFRONT_GUTTER} pt-6`}>
          <SectionHead title={t('storefront.trends.title')} />
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {merch.trends.map((product) => (
              <div key={product.slug} className="w-[132px] shrink-0">
                <StorefrontProductCard product={product} compact />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {merch.promos.length > 0 ? (
        <section className={`${STOREFRONT_GUTTER} pt-6`}>
          <div className={`grid gap-3 ${merch.promos.length > 1 ? 'md:grid-cols-2' : ''}`}>
            {merch.promos.map((promo) => (
              <Link
                key={promo.kind}
                href={`/?category=${encodeURIComponent(promo.categorySlug)}`}
                className="flex items-center gap-3 overflow-hidden rounded-[var(--shop-radius-lg)] bg-[var(--shop-tile)] p-3"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--shop-radius-md)] bg-white">
                  {promo.image ? (
                    <Image
                      src={promo.image}
                      alt={promo.categoryName}
                      fill
                      className="object-contain p-1.5"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[var(--shop-muted)]">
                      <Package className="h-6 w-6" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[var(--shop-text)]">
                    {t(PROMO_COPY[promo.kind].title)}
                  </h2>
                  <p className="mt-0.5 line-clamp-2 text-sm text-[var(--shop-text-secondary)]">
                    {t(PROMO_COPY[promo.kind].body)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--shop-green)]">
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
