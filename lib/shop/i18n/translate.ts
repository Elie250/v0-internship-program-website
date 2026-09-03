import { shopMessagesEn, type ShopMessageKey } from '@/lib/shop/i18n/messages/en'
import { shopMessagesRw } from '@/lib/shop/i18n/messages/rw'
import { SHOP_DEFAULT_LOCALE, type ShopLocale } from '@/lib/shop/i18n/locales'

export type ShopTranslateParams = Record<string, string | number>

export function getShopMessage(
  locale: ShopLocale,
  key: ShopMessageKey
): string {
  if (locale === 'rw') {
    const rw = shopMessagesRw[key]
    if (typeof rw === 'string' && rw.length > 0) return rw
  }
  return shopMessagesEn[key]
}

export function interpolateShopMessage(
  template: string,
  params?: ShopTranslateParams
): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name]
    return value === undefined || value === null ? `{${name}}` : String(value)
  })
}

const STOCK_STATE_KEYS: Record<string, ShopMessageKey> = {
  consumed: 'stockState.consumed',
  reserved: 'stockState.reserved',
  released: 'stockState.released',
}

const PAYMENT_STATUS_KEYS: Record<string, ShopMessageKey> = {
  paid: 'common.paid',
  pending: 'common.pending',
  pending_review: 'orders.paymentAwaiting',
  approved: 'common.approved',
  rejected: 'orders.paymentRejected',
  momo: 'orders.momoPayment',
}

/** UI label for known stock_state values; unknown codes stay as stored. */
export function shopStockStateLabel(
  locale: ShopLocale,
  raw: string | null | undefined
): string {
  if (!raw) return shopMessagesEn['common.emDash']
  const key = STOCK_STATE_KEYS[raw.toLowerCase()]
  return key ? translateShopMessage(locale, key) : raw
}

/** UI label for known payment status codes used in POS chrome. */
export function shopPaymentStatusLabel(
  locale: ShopLocale,
  raw: string | null | undefined
): string {
  if (!raw) return shopMessagesEn['common.emDash']
  const key = PAYMENT_STATUS_KEYS[raw.toLowerCase()]
  return key ? translateShopMessage(locale, key) : raw
}

export function translateShopMessage(
  locale: ShopLocale,
  key: ShopMessageKey,
  params?: ShopTranslateParams
): string {
  return interpolateShopMessage(getShopMessage(locale, key), params)
}

/** Keys present in English without an approved Kinyarwanda entry. */
export function listMissingKinyarwandaKeys(): ShopMessageKey[] {
  return (Object.keys(shopMessagesEn) as ShopMessageKey[]).filter(
    (key) => !shopMessagesRw[key]
  )
}

export function createShopTranslator(locale: ShopLocale = SHOP_DEFAULT_LOCALE) {
  return (key: ShopMessageKey, params?: ShopTranslateParams) =>
    translateShopMessage(locale, key, params)
}
