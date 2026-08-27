'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import {
  StorefrontAddToCart,
  StorefrontAvailability,
  StorefrontQuantityStepper,
} from '@/components/storefront/storefront-add-to-cart'
import { formatShopRwf } from '@/lib/shop/format'
import type { PublicCatalogueItem } from '@/lib/shop/public-catalogue'

export function StorefrontProductMissing() {
  const t = useShopT()
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">{t('storefront.product.title')}</h1>
      <p className="mt-3 text-slate-600">{t('storefront.product.notFound')}</p>
      <Button
        asChild
        className="mt-8 bg-[var(--brand-navy,#1e3a5f)] text-white hover:bg-[var(--brand-navy,#1e3a5f)]/90"
      >
        <Link href="/">{t('storefront.product.back')}</Link>
      </Button>
    </section>
  )
}

export function StorefrontProductDetail({ product }: { product: PublicCatalogueItem }) {
  const t = useShopT()
  const [quantity, setQuantity] = useState(1)
  const specEntries = Object.entries(product.specifications ?? {}).filter(
    ([key, value]) => key.trim() && String(value).trim()
  )

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-14">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        {product.image ? (
          <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
            <Package className="h-12 w-12" aria-hidden />
          </div>
        )}
      </div>
      <div>
        {product.categoryName ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {product.categoryName}
          </p>
        ) : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{product.name}</h1>
        <p className="mt-4 text-3xl font-semibold text-[var(--brand-navy,#1e3a5f)]">
          {formatShopRwf(product.price)}
        </p>
        <div className="mt-3">
          <StorefrontAvailability value={product.availability} />
        </div>
        {product.description ? (
          <p className="mt-6 text-sm leading-relaxed text-slate-700 sm:text-base">
            {product.description}
          </p>
        ) : null}
        {product.sku ? (
          <p className="mt-4 text-sm text-slate-600">
            {t('common.sku')}: {product.sku}
          </p>
        ) : null}
        {product.inStock ? (
          <div className="mt-6">
            <StorefrontQuantityStepper
              value={quantity}
              max={product.maxQuantity}
              onChange={setQuantity}
            />
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <StorefrontAddToCart product={product} quantity={quantity} className="min-w-[10rem]" />
          <Button asChild variant="outline" className="border-slate-300">
            <Link href="/">{t('storefront.product.back')}</Link>
          </Button>
        </div>
        {specEntries.length > 0 ? (
          <dl className="mt-8 space-y-2 border-t border-slate-200 pt-6">
            {specEntries.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 text-sm">
                <dt className="font-medium text-slate-800">{key}</dt>
                <dd className="text-slate-600">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  )
}
