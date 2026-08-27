'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import {
  StorefrontAddToCart,
  StorefrontAvailability,
} from '@/components/storefront/storefront-add-to-cart'
import { formatShopRwf } from '@/lib/shop/format'
import type { PublicCatalogueItem } from '@/lib/shop/public-catalogue'

export function StorefrontProductCard({ product }: { product: PublicCatalogueItem }) {
  const t = useShopT()
  const href = `/product/${encodeURIComponent(product.slug)}`

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={href} className="relative block aspect-square bg-slate-50">
        {product.image ? (
          <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <Package className="h-8 w-8" aria-hidden />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p
          className="min-h-[1rem] text-[11px] font-semibold uppercase tracking-wide text-slate-500"
          aria-hidden={!product.categoryName}
        >
          {product.categoryName || '\u00a0'}
        </p>
        <Link href={href} className="mt-1">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-slate-900">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 text-base font-semibold text-[var(--brand-navy,#1e3a5f)]">
          {formatShopRwf(product.price)}
        </p>
        <div className="mt-1">
          <StorefrontAvailability value={product.availability} />
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
          <Button asChild size="sm" variant="outline" className="h-8 border-slate-300">
            <Link href={href}>{t('action.details')}</Link>
          </Button>
          <StorefrontAddToCart product={product} className="h-8 px-3 text-sm" />
        </div>
      </div>
    </article>
  )
}
