'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Package, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AddToCartButton } from '@/components/shop/add-to-cart-button'
import { cn } from '@/lib/utils'
import type { Category, Product } from '@/types/platform'

function ProductImage({ src, alt }: { src?: string; alt: string }) {
  if (src) {
    return (
      <div className="relative h-44 w-full bg-slate-100">
        <Image src={src} alt={alt} fill className="object-cover" unoptimized />
      </div>
    )
  }

  return (
    <div className="h-44 w-full bg-slate-100 flex flex-col items-center justify-center text-slate-600 gap-2">
      <Package className="h-8 w-8 opacity-60" />
      <span className="text-xs font-medium">No image</span>
    </div>
  )
}

function CategoryButton({
  active,
  href,
  children,
}: {
  active: boolean
  href: string
  children: React.ReactNode
}) {
  return (
    <Link href={href}>
      <Button
        size="sm"
        variant="outline"
        className={cn(
          'font-medium shadow-sm',
          active ? 'shop-category-active' : 'shop-category-inactive'
        )}
      >
        {children}
      </Button>
    </Link>
  )
}

export function ShopCatalog({
  categories,
  products,
  activeCategory,
  searchQuery,
}: {
  categories: Category[]
  products: Product[]
  activeCategory?: string
  searchQuery?: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState(searchQuery ?? '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (activeCategory) params.set('category', activeCategory)
    if (query) params.set('q', query)
    router.push(`/shop?${params.toString()}`)
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="pl-9 border-slate-300 text-slate-900 placeholder:text-slate-500"
          />
        </div>
        <Button type="submit" className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
          Search
        </Button>
      </form>

      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Categories</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        <CategoryButton active={!activeCategory} href="/shop">
          All
        </CategoryButton>
        {categories.map((cat) => (
          <CategoryButton
            key={cat.id}
            active={activeCategory === cat.slug}
            href={`/shop?category=${cat.slug}`}
          >
            {cat.name}
          </CategoryButton>
        ))}
      </div>

      {products.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-10 text-center text-slate-600">
            No products found. Administrators can add products and categories from the Admin Portal.
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const image = product.images?.[0]
            const finalPrice = product.discount
              ? product.price - product.discount
              : product.price
            return (
              <Card
                key={product.id}
                className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow bg-white"
              >
                <ProductImage src={image} alt={product.name} />
                <CardHeader className="pb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {product.category?.name ?? 'General'}
                  </p>
                  <CardTitle className="text-lg text-slate-900 leading-snug">{product.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">{product.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-lg text-[var(--brand-navy)]">
                      {finalPrice.toLocaleString()} RWF
                    </span>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        product.stock > 0 ? 'text-emerald-700' : 'text-red-700'
                      )}
                    >
                      {product.stock > 0 ? `In stock (${product.stock})` : 'Out of stock'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/shop/${product.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-slate-300 text-slate-800 hover:bg-slate-50"
                      >
                        Details
                      </Button>
                    </Link>
                    <AddToCartButton
                      productId={product.id}
                      name={product.name}
                      price={finalPrice}
                      stock={product.stock}
                      image={image}
                      size="sm"
                      className="w-full bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
