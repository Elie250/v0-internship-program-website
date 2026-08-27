import { Suspense } from 'react'
import { StorefrontHome } from '@/components/storefront/storefront-home'
import {
  StorefrontCatalogue,
  StorefrontCatalogueLoading,
} from '@/components/storefront/storefront-catalogue'
import { loadPublicCatalogue } from '@/lib/shop/public-catalogue'

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

  return (
    <StorefrontCatalogue
      products={result.products}
      categories={result.categories}
      activeCategory={categorySlug}
      searchQuery={search ?? ''}
      error={result.error}
    />
  )
}

export default function StorefrontHomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  return (
    <>
      <StorefrontHome />
      <Suspense fallback={<StorefrontCatalogueLoading />}>
        <StorefrontCatalogueSection searchParams={searchParams} />
      </Suspense>
    </>
  )
}
