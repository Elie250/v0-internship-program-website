import { cookies } from 'next/headers'
import {
  SHOP_DEFAULT_LOCALE,
  SHOP_LOCALE_COOKIE,
  isShopLocale,
  type ShopLocale,
} from '@/lib/shop/i18n/locales'

export async function readStorefrontLocale(): Promise<ShopLocale> {
  const jar = await cookies()
  const raw = jar.get(SHOP_LOCALE_COOKIE)?.value
  return isShopLocale(raw) ? raw : SHOP_DEFAULT_LOCALE
}
