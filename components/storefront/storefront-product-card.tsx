'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Package } from 'lucide-react'
import { StorefrontAddToCart } from '@/components/storefront/storefront-add-to-cart'
import { formatShopRwf } from '@/lib/shop/format'
import {
  publicDiscountPercent,
  type PublicCatalogueItem,
} from '@/lib/shop/public-catalogue'
import { cn } from '@/lib/utils'

export function StorefrontProductCard({
  product,
  compact = false,
}: {
  product: PublicCatalogueItem
  compact?: boolean
}) {
  const href = `/product/${encodeURIComponent(product.slug)}`
  const percent = publicDiscountPercent(product.listPrice, product.price)

  return (
    <article className="flex h-full flex-col gap-1.5">
      <Link
        href={href}
        className={cn(
          'relative block overflow-hidden rounded-[var(--shop-radius-md)] bg-[var(--shop-tile)]',
          compact ? 'h-24' : 'aspect-square'
        )}
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-2"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--shop-muted)]">
            <Package className={compact ? 'h-6 w-6' : 'h-8 w-8'} aria-hidden />
          </div>
        )}
        {percent ? (
          <span className="absolute left-2 top-2 rounded-full bg-[var(--shop-green)] px-2 py-0.5 text-[10px] font-bold text-white">
            −{percent}%
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col">
        <Link href={href}>
          <h3 className="line-clamp-2 min-h-[2.125rem] text-[13px] font-semibold leading-[17px] text-[var(--shop-text)]">
            {product.name}
          </h3>
        </Link>
        <p className="mt-0.5 text-sm font-bold text-[var(--shop-green)]">
          {formatShopRwf(product.price)}
          {product.listPrice ? (
            <span className="ml-2 text-xs font-normal text-[var(--shop-muted)] line-through">
              {formatShopRwf(product.listPrice)}
            </span>
          ) : null}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <p className="min-w-0 truncate text-[11px] text-[var(--shop-muted)]">
            {product.sellingUnitLabel}
          </p>
          <StorefrontAddToCart product={product} variant="icon" />
        </div>
      </div>
    </article>
  )
}
