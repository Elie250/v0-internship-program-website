'use client'

import { getDefaultStorefrontShop, type StorefrontShopOption } from '@/lib/shop/storefront-shops'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'

/**
 * Customer shop context. With one available shop this is a label.
 * When more shops are marked available, this becomes a selector.
 */
export function StorefrontShopContext({
  shops,
  currentCode,
}: {
  shops: readonly StorefrontShopOption[]
  currentCode: string
}) {
  const t = useShopT()
  const available = shops.filter((shop) => shop.available)
  const current =
    available.find((shop) => shop.code === currentCode) ??
    available[0] ??
    getDefaultStorefrontShop()

  if (available.length <= 1) {
    return (
      <p className="text-sm text-slate-700">
        <span className="text-slate-500">{t('storefront.shoppingFrom')}:</span>{' '}
        <span className="font-semibold text-slate-900">{current.name}</span>
      </p>
    )
  }

  return (
    <label className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
      <span className="text-slate-500">{t('storefront.shoppingFrom')}:</span>
      <select
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-semibold text-slate-900"
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
