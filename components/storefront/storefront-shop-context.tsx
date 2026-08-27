'use client'

import { MapPin } from 'lucide-react'
import { getDefaultStorefrontShop, type StorefrontShopOption } from '@/lib/shop/storefront-shops'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { cn } from '@/lib/utils'

/**
 * Customer shop context indicator.
 * With one available shop this is a label, not a switcher.
 * When more shops are marked available, this becomes a selector.
 * It is not inventory authority.
 */
export function StorefrontShopContext({
  shops,
  currentCode,
  tone = 'default',
  className,
}: {
  shops: readonly StorefrontShopOption[]
  currentCode: string
  tone?: 'default' | 'header'
  className?: string
}) {
  const t = useShopT()
  const available = shops.filter((shop) => shop.available)
  const current =
    available.find((shop) => shop.code === currentCode) ??
    available[0] ??
    getDefaultStorefrontShop()

  const header = tone === 'header'
  const labelClass = header ? 'text-white/80' : 'text-slate-700'
  const valueClass = header ? 'text-white' : 'text-slate-900'

  if (available.length <= 1) {
    return (
      <p
        className={cn('inline-flex min-w-0 max-w-[11rem] items-center gap-1 text-xs', className)}
        aria-label={`${t('storefront.shoppingFrom')}: ${current.name}`}
      >
        <MapPin className={cn('h-3.5 w-3.5 shrink-0', labelClass)} aria-hidden />
        <span className={cn('truncate font-medium', valueClass)}>{current.name}</span>
      </p>
    )
  }

  return (
    <label
      className={cn('inline-flex min-w-0 items-center gap-1 text-xs', className)}
    >
      <MapPin className={cn('h-3.5 w-3.5 shrink-0', labelClass)} aria-hidden />
      <span className="sr-only">{t('storefront.shoppingFrom')}</span>
      <select
        className={cn(
          'max-w-[11rem] truncate rounded-md border-0 bg-transparent py-0.5 text-xs font-medium',
          valueClass
        )}
        defaultValue={current.code}
        aria-label={t('storefront.shoppingFrom')}
      >
        {available.map((shop) => (
          <option key={shop.code} value={shop.code}>
            {shop.name}
          </option>
        ))}
      </select>
    </label>
  )
}
