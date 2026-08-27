'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Package } from 'lucide-react'
import {
  StorefrontAddToCart,
  StorefrontAvailability,
} from '@/components/storefront/storefront-add-to-cart'
import { formatShopRwf } from '@/lib/shop/format'
import {
  publicDiscountPercent,
  type PublicCatalogueItem,
} from '@/lib/shop/public-catalogue'

export function StorefrontProductCard({ product }: { product: PublicCatalogueItem }) {
  const href = `/product/${encodeURIComponent(product.slug)}`
  const percent = publicDiscountPercent(product.listPrice, product.price)

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={href} className="relative block aspect-square bg-slate-50">
        {product.image ? (
          <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <Package className="h-8 w-8" aria-hidden />
          </div>
        )}
        {percent ? (
          <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-[var(--brand-navy,#1e3a5f)]">
            −{percent}%
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <Link href={href}>
          <h3 className="line-clamp-2 min-h-[2.25rem] text-sm font-semibold leading-snug text-slate-900">
            {product.name}
          </h3>
        </Link>
        <p className="mt-0.5 text-xs text-slate-500">{product.sellingUnitLabel}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-sm font-semibold text-[var(--brand-navy,#1e3a5f)] sm:text-base">
            {formatShopRwf(product.price)}
          </p>
          {product.listPrice ? (
            <p className="text-xs text-slate-400 line-through">{formatShopRwf(product.listPrice)}</p>
          ) : null}
        </div>
        <div className="mt-1">
          <StorefrontAvailability value={product.availability} />
        </div>
        <div className="mt-auto pt-2">
          <StorefrontAddToCart product={product} className="h-8 w-full px-3 text-sm" />
        </div>
      </div>
    </article>
  )
}
