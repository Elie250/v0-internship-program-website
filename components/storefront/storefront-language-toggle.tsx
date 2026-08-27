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
  emphasis,
}: {
  className?: string
  inverted?: boolean
  compact?: boolean
  /** High-contrast buttons for the opaque mobile menu drawer. */
  emphasis?: boolean
}) {
  const { locale, setLocale, t } = useShopI18n()
  const labels: Record<ShopLocale, string> = compact
    ? { en: 'EN', rw: 'RW' }
    : SHOP_LOCALE_LABELS

  return (
    <div
      role="group"
      aria-label={t('a11y.language')}
      className={cn('flex items-center gap-1.5 text-sm', emphasis && 'w-full gap-2', className)}
    >
      {SHOP_LOCALES.map((code, index) => (
        <span key={code} className={cn('flex items-center gap-1.5', emphasis && 'min-w-0 flex-1')}>
          {index > 0 && !emphasis ? (
            <span className={inverted ? 'text-white/35' : 'text-slate-400'} aria-hidden>
              |
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setLocale(code as ShopLocale)}
            className={cn(
              'rounded-sm px-0.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy,#1e3a5f)] focus-visible:ring-offset-2',
              emphasis && 'min-h-11 w-full rounded-md px-3',
              inverted
                ? locale === code
                  ? 'text-white'
                  : 'text-white/80 hover:text-white'
                : emphasis
                  ? locale === code
                    ? 'bg-[var(--brand-navy,#1e3a5f)] text-white'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  : locale === code
                    ? 'text-[var(--brand-navy,#1e3a5f)]'
                    : 'text-slate-700 hover:text-slate-900'
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
