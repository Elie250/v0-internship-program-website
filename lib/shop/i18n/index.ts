export {
  SHOP_LOCALES,
  SHOP_DEFAULT_LOCALE,
  SHOP_LOCALE_COOKIE,
  SHOP_LOCALE_STORAGE_KEY,
  SHOP_LOCALE_LABELS,
  isShopLocale,
  type ShopLocale,
} from '@/lib/shop/i18n/locales'
export { shopMessagesEn, type ShopMessageKey } from '@/lib/shop/i18n/messages/en'
export { shopMessagesRw } from '@/lib/shop/i18n/messages/rw'
export {
  getShopMessage,
  interpolateShopMessage,
  translateShopMessage,
  listMissingKinyarwandaKeys,
  createShopTranslator,
  shopStockStateLabel,
  shopPaymentStatusLabel,
  type ShopTranslateParams,
} from '@/lib/shop/i18n/translate'
