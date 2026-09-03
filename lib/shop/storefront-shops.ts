import { SHOP_LOCATION_CODES } from '@/lib/shop/locations'

/**
 * Customer-facing shop choices for the public storefront.
 *
 * This is display/context only — not inventory authority.
 * `products.stock` remains the single stock figure until a later phase.
 * Add Kigali / Huye (and others) here when those shops are operational.
 */
export type StorefrontShopOption = {
  code: string
  name: string
  available: boolean
}

export const STOREFRONT_SHOP_OPTIONS: readonly StorefrontShopOption[] = [
  {
    code: SHOP_LOCATION_CODES.NYANZA,
    name: 'Nyanza Shop',
    available: true,
  },
]

export function getAvailableStorefrontShops(): StorefrontShopOption[] {
  return STOREFRONT_SHOP_OPTIONS.filter((shop) => shop.available)
}

export function getDefaultStorefrontShop(): StorefrontShopOption {
  return getAvailableStorefrontShops()[0] ?? STOREFRONT_SHOP_OPTIONS[0]
}

export function getStorefrontShopByCode(code: string): StorefrontShopOption | undefined {
  return STOREFRONT_SHOP_OPTIONS.find((shop) => shop.code === code)
}

/** Public customer nav on the shop host. Staff URLs stay under /manage and short aliases. */
export const STOREFRONT_NAV_ITEMS = [
  { href: '/', labelKey: 'storefront.nav.products' as const },
  { href: '/cart', labelKey: 'storefront.nav.cart' as const },
  { href: '/track', labelKey: 'storefront.nav.track' as const },
] as const
