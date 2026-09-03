import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { shopUiEn, type ShopUiKey } from '@/src/i18n/messages/en'
import { shopUiRw } from '@/src/i18n/messages/rw'

export type ShopLocale = 'en' | 'rw'

const LOCALE_KEY = 'el.customer.locale'

const dictionaries: Record<ShopLocale, Record<ShopUiKey, string>> = {
  en: shopUiEn,
  rw: shopUiRw,
}

type LocaleState = {
  locale: ShopLocale
  hydrated: boolean
  hydrate: () => Promise<void>
  setLocale: (locale: ShopLocale) => Promise<void>
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: 'en',
  hydrated: false,
  hydrate: async () => {
    try {
      const stored = await SecureStore.getItemAsync(LOCALE_KEY)
      if (stored === 'en' || stored === 'rw') {
        set({ locale: stored, hydrated: true })
        return
      }
    } catch {
      /* keep default */
    }
    set({ hydrated: true })
  },
  setLocale: async (locale) => {
    set({ locale })
    try {
      await SecureStore.setItemAsync(LOCALE_KEY, locale)
    } catch {
      /* display language still updates */
    }
  },
}))

export function translate(
  locale: ShopLocale,
  key: ShopUiKey,
  vars?: Record<string, string | number>
): string {
  let value = dictionaries[locale][key] || shopUiEn[key]
  if (!vars) return value
  for (const [name, replacement] of Object.entries(vars)) {
    value = value.replaceAll(`{${name}}`, String(replacement))
  }
  return value
}

export function useShopText() {
  const locale = useLocaleStore((s) => s.locale)
  return (key: ShopUiKey, vars?: Record<string, string | number>) =>
    translate(locale, key, vars)
}
