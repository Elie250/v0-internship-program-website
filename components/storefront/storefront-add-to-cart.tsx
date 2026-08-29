'use client'

import { Check, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { useShopCart } from '@/lib/shop/cart-context'
import {
  canAddPublicProductToCart,
  type PublicCatalogueItem,
} from '@/lib/shop/public-catalogue'
import { cn } from '@/lib/utils'

export function StorefrontAddToCart({
  product,
  quantity = 1,
  className,
  variant = 'button',
}: {
  product: PublicCatalogueItem
  quantity?: number
  className?: string
  variant?: 'button' | 'icon'
}) {
  const t = useShopT()
  const { addItem } = useShopCart()
  const canAdd = canAddPublicProductToCart(product)

  if (!canAdd) {
    if (variant === 'icon') {
      return (
        <Button
          type="button"
          disabled
          size="icon"
          aria-label={t('storefront.catalogue.unavailable')}
          className={cn('size-8 rounded-full bg-[#D1D5DB] text-white hover:bg-[#D1D5DB]', className)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      )
    }
    return (
      <Button type="button" disabled className={className}>
        {t('storefront.catalogue.unavailable')}
      </Button>
    )
  }

  return (
    <Button
      type="button"
      size={variant === 'icon' ? 'icon' : 'default'}
      aria-label={variant === 'icon' ? t('storefront.catalogue.addToCart') : undefined}
      className={cn(
        'bg-[var(--shop-green,#1fa64a)] text-white hover:bg-[var(--shop-green-pressed,#17863b)]',
        variant === 'icon' && 'size-8 rounded-full',
        className
      )}
      onClick={() =>
        addItem(
          {
            productId: product.slug,
            name: product.name,
            price: product.price,
            image: product.image ?? undefined,
            maxStock: product.maxQuantity,
            sellingUnitLabel: product.sellingUnitLabel,
          },
          quantity
        )
      }
    >
      {variant === 'icon' ? <Plus className="h-4 w-4" /> : t('storefront.catalogue.addToCart')}
    </Button>
  )
}

export function StorefrontAvailability({
  value,
  onDark = false,
}: {
  value: PublicCatalogueItem['availability']
  onDark?: boolean
}) {
  const t = useShopT()
  const label =
    value === 'out'
      ? t('storefront.availability.out')
      : value === 'few'
        ? t('storefront.availability.few')
        : t('storefront.availability.available')

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold',
        onDark
          ? value === 'out'
            ? 'text-red-200'
            : value === 'few'
              ? 'text-amber-200'
              : 'text-emerald-200'
          : value === 'out'
            ? 'text-red-700'
            : value === 'few'
              ? 'text-amber-700'
              : 'text-emerald-700'
      )}
    >
      {value !== 'out' ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
      {label}
    </span>
  )
}

export function StorefrontQuantityStepper({
  value,
  max,
  onChange,
}: {
  value: number
  max: number
  onChange: (next: number) => void
}) {
  const t = useShopT()
  const cap = Math.max(1, max)

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-800">{t('common.quantity')}</p>
      <div className="inline-flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-9 w-9 border-slate-300"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          aria-label={t('action.previous')}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center text-sm font-semibold text-slate-900">{value}</span>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-9 w-9 border-slate-300"
          onClick={() => onChange(Math.min(cap, value + 1))}
          disabled={value >= cap}
          aria-label={t('action.next')}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
