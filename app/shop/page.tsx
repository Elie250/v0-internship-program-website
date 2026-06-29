import Link from 'next/link'
import { SiteFooter } from '@/components/layout/site-footer'
import { ShopCatalog } from '@/components/shop/shop-catalog'
import { getCategories, getPublishedProducts } from '@/lib/platform/queries'

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const params = await searchParams
  const categories = await getCategories('shop')
  const products = await getPublishedProducts(params.category, params.q)

  return (
    <>
      <section className="bg-[#1e3a5f] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Shop Portal</h1>
          <p className="text-white/80">
            Browse engineering products, add to cart, and submit an order with your contact details for delivery or pickup.
          </p>
        </div>
      </section>
      <ShopCatalog categories={categories} products={products} activeCategory={params.category} searchQuery={params.q} />
      <SiteFooter />
    </>
  )
}
