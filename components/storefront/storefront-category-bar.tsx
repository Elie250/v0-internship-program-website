'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { STOREFRONT_GUTTER } from '@/lib/shop/storefront-layout'
import type { PublicCatalogueCategory } from '@/lib/shop/public-catalogue'
import { cn } from '@/lib/utils'

export function StorefrontCategoryBar({
  categories,
  activeCategory,
  searchQuery,
}: {
  categories: PublicCatalogueCategory[]
  activeCategory?: string
  searchQuery?: string
}) {
  const t = useShopT()
  if (categories.length === 0) return null

  const hrefFor = (slug?: string) => {
    const params = new URLSearchParams()
    if (slug) params.set('category', slug)
    if (searchQuery?.trim()) params.set('q', searchQuery.trim())
    const suffix = params.toString()
    return suffix ? `/?${suffix}` : '/'
  }

  return (
    <nav
      aria-label={t('storefront.categories.title')}
      className="w-full min-w-0 border-b border-slate-200 bg-white"
    >
      <div className={`${STOREFRONT_GUTTER} flex max-w-full gap-2 overflow-x-auto py-2.5`}>
        <CategoryLink active={!activeCategory} href={hrefFor()}>
          {t('storefront.catalogue.all')}
        </CategoryLink>
        {categories.map((category) => (
          <CategoryLink
            key={category.slug}
            active={activeCategory === category.slug}
            href={hrefFor(category.slug)}
          >
            {category.name}
          </CategoryLink>
        ))}
      </div>
    </nav>
  )
}

function CategoryLink({
  active,
  href,
  children,
}: {
  active: boolean
  href: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-[var(--shop-green,#1fa64a)] bg-[var(--shop-green,#1fa64a)] text-white'
          : 'border-[var(--shop-border)] bg-white text-[var(--shop-text-secondary)] hover:bg-[var(--shop-tile)]'
      )}
    >
      {children}
    </Link>
  )
}
