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
      <section className="text-on-dark bg-[var(--brand-navy)] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Products</h1>
          <p className="text-white/90 max-w-2xl">
            Browse engineering products, add to cart, and checkout with MTN MoMo or IremboPay.
          </p>
        </div>
      </section>
      <ShopCatalog categories={categories} products={products} activeCategory={params.category} searchQuery={params.q} />
      <SiteFooter />
    </>
  )
}
