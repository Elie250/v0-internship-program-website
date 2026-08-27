'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { StorefrontProductCard } from '@/components/storefront/storefront-product-card'
import type { PublicCatalogueCategory, PublicCatalogueItem } from '@/lib/shop/public-catalogue'
import { cn } from '@/lib/utils'

export function StorefrontCatalogueLoading() {
  const t = useShopT()
  return (
    <section id="products" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm text-slate-600">{t('storefront.catalogue.loading')}</p>
    </section>
  )
}

export function StorefrontCatalogue({
  products,
  categories,
  activeCategory,
  searchQuery,
  error,
}: {
  products: PublicCatalogueItem[]
  categories: PublicCatalogueCategory[]
  activeCategory?: string
  searchQuery: string
  error: boolean
}) {
  const t = useShopT()
  const router = useRouter()
  const [query, setQuery] = useState(searchQuery)
  const hasFilters = Boolean(activeCategory || searchQuery.trim())

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (activeCategory) params.set('category', activeCategory)
    if (query.trim()) params.set('q', query.trim())
    const suffix = params.toString()
    router.push(suffix ? `/?${suffix}` : '/')
  }

  const categoryHref = (slug?: string) => {
    const params = new URLSearchParams()
    if (slug) params.set('category', slug)
    if (query.trim()) params.set('q', query.trim())
    const suffix = params.toString()
    return suffix ? `/?${suffix}` : '/'
  }

  let emptyMessage = t('storefront.catalogue.empty')
  if (error) emptyMessage = t('storefront.catalogue.error')
  else if (hasFilters && products.length === 0) emptyMessage = t('storefront.catalogue.noResults')

  return (
    <section id="products" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          {t('storefront.catalogue.title')}
        </h2>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">{t('storefront.catalogue.hint')}</p>
      </div>

      <form onSubmit={submitSearch} className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('storefront.catalogue.searchPlaceholder')}
            className="h-11 pl-9"
            name="q"
            aria-label={t('action.search')}
          />
        </div>
        <Button
          type="submit"
          className="h-11 bg-[var(--brand-navy,#1e3a5f)] text-white hover:bg-[var(--brand-navy,#1e3a5f)]/90"
        >
          {t('action.search')}
        </Button>
      </form>

      {categories.length > 0 ? (
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
          <CategoryChip active={!activeCategory} href={categoryHref()}>
            {t('storefront.catalogue.all')}
          </CategoryChip>
          {categories.map((category) => (
            <CategoryChip
              key={category.slug}
              active={activeCategory === category.slug}
              href={categoryHref(category.slug)}
            >
              {category.name}
            </CategoryChip>
          ))}
        </div>
      ) : null}

      {products.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-400" aria-hidden />
          <p className="mt-4 text-sm font-medium text-slate-700">{emptyMessage}</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <StorefrontProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}

function CategoryChip({
  active,
  href,
  children,
}: {
  active: boolean
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-[var(--brand-navy,#1e3a5f)] bg-[var(--brand-navy,#1e3a5f)] text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
      )}
    >
      {children}
    </Link>
  )
}
