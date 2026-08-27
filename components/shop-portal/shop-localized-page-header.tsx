'use client'

import { ShopPageHeader } from '@/components/shop-portal/shop-page-chrome'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import type { ShopMessageKey } from '@/lib/shop/i18n/messages/en'
import type { ShopTranslateParams } from '@/lib/shop/i18n/translate'

export function ShopLocalizedPageHeader({
  titleKey,
  descriptionKey,
  descriptionParams,
  descriptionParamKeys,
}: {
  titleKey: ShopMessageKey
  descriptionKey: ShopMessageKey
  descriptionParams?: ShopTranslateParams
  /** Params whose values are themselves message keys (e.g. siteLabel -> brand.siteLabel). */
  descriptionParamKeys?: Record<string, ShopMessageKey>
}) {
  const t = useShopT()
  const params: ShopTranslateParams | undefined = descriptionParamKeys
    ? {
        ...descriptionParams,
        ...Object.fromEntries(
          Object.entries(descriptionParamKeys).map(([name, key]) => [name, t(key)])
        ),
      }
    : descriptionParams

  return <ShopPageHeader title={t(titleKey)} description={t(descriptionKey, params)} />
}
