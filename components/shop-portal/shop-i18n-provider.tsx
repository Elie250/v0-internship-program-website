'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  SHOP_DEFAULT_LOCALE,
  SHOP_LOCALE_COOKIE,
  SHOP_LOCALE_STORAGE_KEY,
  isShopLocale,
  type ShopLocale,
} from '@/lib/shop/i18n/locales'
import {
  translateShopMessage,
  type ShopTranslateParams,
} from '@/lib/shop/i18n/translate'
import type { ShopMessageKey } from '@/lib/shop/i18n/messages/en'

type ShopI18nContextValue = {
  locale: ShopLocale
  setLocale: (locale: ShopLocale) => void
  t: (key: ShopMessageKey, params?: ShopTranslateParams) => string
}

const ShopI18nContext = createContext<ShopI18nContextValue | null>(null)

function persistLocale(locale: ShopLocale) {
  try {
    window.localStorage.setItem(SHOP_LOCALE_STORAGE_KEY, locale)
  } catch {
    /* ignore quota / private mode */
  }
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : ''
  document.cookie = `${SHOP_LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`
}

function readStoredLocale(): ShopLocale | null {
  try {
    const stored = window.localStorage.getItem(SHOP_LOCALE_STORAGE_KEY)
    if (isShopLocale(stored)) return stored
  } catch {
    /* ignore */
  }
  return null
}

export function ShopI18nProvider({
  children,
  initialLocale = SHOP_DEFAULT_LOCALE,
}: {
  children: ReactNode
  initialLocale?: ShopLocale
}) {
  const [locale, setLocaleState] = useState<ShopLocale>(initialLocale)

  useEffect(() => {
    const stored = readStoredLocale()
    if (stored && stored !== locale) {
      setLocaleState(stored)
    }
    // Sync cookie once on mount for SSR preference on later navigations
    persistLocale(stored ?? locale)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate from storage once
  }, [])

  const setLocale = useCallback((next: ShopLocale) => {
    setLocaleState(next)
    persistLocale(next)
  }, [])

  const t = useCallback(
    (key: ShopMessageKey, params?: ShopTranslateParams) =>
      translateShopMessage(locale, key, params),
    [locale]
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <ShopI18nContext.Provider value={value}>{children}</ShopI18nContext.Provider>
}

export function useShopI18n(): ShopI18nContextValue {
  const ctx = useContext(ShopI18nContext)
  if (!ctx) {
    throw new Error('useShopI18n must be used within ShopI18nProvider')
  }
  return ctx
}

export function useShopT() {
  return useShopI18n().t
}
