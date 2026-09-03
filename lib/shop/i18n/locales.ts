export const SHOP_LOCALES = ['en', 'rw'] as const

export type ShopLocale = (typeof SHOP_LOCALES)[number]

export const SHOP_DEFAULT_LOCALE: ShopLocale = 'en'

export const SHOP_LOCALE_COOKIE = 'shop_locale'
export const SHOP_LOCALE_STORAGE_KEY = 'shop_locale'

export const SHOP_LOCALE_LABELS: Record<ShopLocale, string> = {
  en: 'English',
  rw: 'Kinyarwanda',
}

export function isShopLocale(value: string | null | undefined): value is ShopLocale {
  return value === 'en' || value === 'rw'
}
