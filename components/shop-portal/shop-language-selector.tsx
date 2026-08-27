'use client'

import {
  SHOP_LOCALES,
  SHOP_LOCALE_LABELS,
  type ShopLocale,
} from '@/lib/shop/i18n/locales'
import { useShopI18n } from '@/components/shop-portal/shop-i18n-provider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ShopLanguageSelector({
  className,
  compact,
}: {
  className?: string
  compact?: boolean
}) {
  const { locale, setLocale, t } = useShopI18n()

  return (
    <div className={className}>
      {!compact ? (
        <label htmlFor="shop-language" className="sr-only">
          {t('common.language')}
        </label>
      ) : null}
      <Select
        value={locale}
        onValueChange={(value) => {
          if (value === 'en' || value === 'rw') setLocale(value as ShopLocale)
        }}
      >
        <SelectTrigger
          id="shop-language"
          aria-label={t('a11y.language')}
          className={compact ? 'h-8 w-[9.5rem] text-xs' : 'h-9 w-[11rem] text-sm'}
        >
          <SelectValue placeholder={t('common.language')} />
        </SelectTrigger>
        <SelectContent>
          {SHOP_LOCALES.map((code) => (
            <SelectItem key={code} value={code}>
              {SHOP_LOCALE_LABELS[code]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
