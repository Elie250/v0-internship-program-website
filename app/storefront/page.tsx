import { Suspense } from 'react'
import { StorefrontHome } from '@/components/storefront/storefront-home'
import {
  StorefrontCatalogue,
  StorefrontCatalogueLoading,
} from '@/components/storefront/storefront-catalogue'
import { StorefrontMerchandising } from '@/components/storefront/storefront-merchandising'
import { StorefrontCategoryBar } from '@/components/storefront/storefront-category-bar'
import { loadPublicCatalogue } from '@/lib/shop/public-catalogue'
import { buildStorefrontMerchandising } from '@/lib/shop/public-merchandising'

function readParam(value: string | string[] | undefined): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

async function StorefrontCatalogueSection({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const params = await searchParams
  const categorySlug = readParam(params.category)
  const search = readParam(params.q)
  const result = await loadPublicCatalogue({ categorySlug, search })
  const filtered = Boolean(categorySlug || search)
  const merch = filtered ? null : buildStorefrontMerchandising(result.products, result.categories)

  return (
    <>
      <StorefrontCategoryBar
        categories={result.categories}
        activeCategory={categorySlug}
        searchQuery={search}
      />
      {merch ? (
        <>
          <StorefrontHome slides={merch.heroProducts} />
          <StorefrontMerchandising merch={merch} />
        </>
      ) : null}
      <StorefrontCatalogue
        products={result.products}
        categories={result.categories}
        activeCategory={categorySlug}
        searchQuery={search ?? ''}
        error={result.error}
        moreInShop={!filtered}
      />
    </>
  )
}

export default function StorefrontHomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  return (
    <Suspense fallback={<StorefrontCatalogueLoading />}>
      <StorefrontCatalogueSection searchParams={searchParams} />
    </Suspense>
  )
}
