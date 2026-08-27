'use client'

import { Package } from 'lucide-react'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { StorefrontProductCard } from '@/components/storefront/storefront-product-card'
import { STOREFRONT_GUTTER } from '@/lib/shop/storefront-layout'
import type { PublicCatalogueCategory, PublicCatalogueItem } from '@/lib/shop/public-catalogue'

export function StorefrontCatalogueLoading() {
  const t = useShopT()
  return (
    <section id="products" className={`${STOREFRONT_GUTTER} py-10`}>
      <p className="text-sm text-slate-600">{t('storefront.catalogue.loading')}</p>
    </section>
  )
}

export function StorefrontCatalogue({
  products,
  activeCategory,
  searchQuery,
  error,
  moreInShop = false,
}: {
  products: PublicCatalogueItem[]
  categories: PublicCatalogueCategory[]
  activeCategory?: string
  searchQuery: string
  error: boolean
  moreInShop?: boolean
}) {
  const t = useShopT()
  const hasFilters = Boolean(activeCategory || searchQuery.trim())

  let emptyMessage = t('storefront.catalogue.empty')
  if (error) emptyMessage = t('storefront.catalogue.error')
  else if (hasFilters && products.length === 0) emptyMessage = t('storefront.catalogue.noResults')

  return (
    <section id="products" className={`${STOREFRONT_GUTTER} py-8 sm:py-10`}>
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          {t(moreInShop ? 'storefront.more.title' : 'storefront.catalogue.title')}
        </h2>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">{t('storefront.catalogue.hint')}</p>
      </div>

      {products.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-400" aria-hidden />
          <p className="mt-4 text-sm font-medium text-slate-700">{emptyMessage}</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {products.map((product) => (
            <StorefrontProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
