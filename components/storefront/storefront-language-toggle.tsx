'use client'

import {
  SHOP_LOCALES,
  SHOP_LOCALE_LABELS,
  type ShopLocale,
} from '@/lib/shop/i18n/locales'
import { useShopI18n } from '@/components/shop-portal/shop-i18n-provider'
import { cn } from '@/lib/utils'

export function StorefrontLanguageToggle({
  className,
  inverted,
  compact,
}: {
  className?: string
  inverted?: boolean
  compact?: boolean
}) {
  const { locale, setLocale, t } = useShopI18n()
  const labels: Record<ShopLocale, string> = compact
    ? { en: 'EN', rw: 'RW' }
    : SHOP_LOCALE_LABELS

  return (
    <div
      role="group"
      aria-label={t('a11y.language')}
      className={cn('flex items-center gap-1.5 text-sm', className)}
    >
      {SHOP_LOCALES.map((code, index) => (
        <span key={code} className="flex items-center gap-1.5">
          {index > 0 ? (
            <span className={inverted ? 'text-white/35' : 'text-slate-300'} aria-hidden>
              |
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setLocale(code as ShopLocale)}
            className={cn(
              'rounded-sm px-0.5 font-medium transition-colors',
              inverted
                ? locale === code
                  ? 'text-white'
                  : 'text-white/70 hover:text-white'
                : locale === code
                  ? 'text-[var(--brand-navy,#1e3a5f)]'
                  : 'text-slate-500 hover:text-slate-800'
            )}
            aria-pressed={locale === code}
          >
            {labels[code]}
          </button>
        </span>
      ))}
    </div>
  )
}
