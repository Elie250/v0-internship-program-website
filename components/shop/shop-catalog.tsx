'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Package, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Category, Product } from '@/types/platform'

function ProductImage({ src, alt }: { src?: string; alt: string }) {
  if (src) {
    return (
      <div className="relative h-44 w-full bg-muted">
        <Image src={src} alt={alt} fill className="object-cover" unoptimized />
      </div>
    )
  }

  return (
    <div className="h-44 w-full bg-muted flex flex-col items-center justify-center text-muted-foreground gap-2">
      <Package className="h-8 w-8 opacity-50" />
      <span className="text-xs">No image</span>
    </div>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="flex flex-wrap gap-2 mb-8">
        <Link href="/shop"><Button size="sm" variant={!activeCategory ? 'secondary' : 'outline'}>All</Button></Link>
        {categories.map((cat) => (
          <Link key={cat.id} href={`/shop?category=${cat.slug}`}>
            <Button size="sm" variant={activeCategory === cat.slug ? 'secondary' : 'outline'}>{cat.name}</Button>
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
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
              <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <ProductImage src={image} alt={product.name} />
                <CardHeader>
                  <p className="text-xs text-muted-foreground">{product.category?.name ?? 'General'}</p>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-[#1e3a5f]">{finalPrice.toLocaleString()} RWF</span>
                    <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                  </div>
                  <Link href={`/shop/${product.id}`}><Button size="sm" className="w-full bg-[#1e3a5f]">View Details</Button></Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
