import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Package } from 'lucide-react'
import { SiteFooter } from '@/components/layout/site-footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddToCartButton } from '@/components/shop/add-to-cart-button'
import { getProductById, getPublishedProducts } from '@/lib/platform/queries'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProductById(id)
  if (!product) notFound()

  const related = (await getPublishedProducts(product.category?.slug))
    .filter((p) => p.id !== product.id)
    .slice(0, 3)

  const finalPrice = product.discount ? product.price - product.discount : product.price
  const specs = Object.entries(product.specifications ?? {})
  const images = product.images?.length ? product.images : []

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-2 gap-10">
        <div>
          <div className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
            {images[0] ? (
              <Image src={images[0]} alt={product.name} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                <Package className="h-12 w-12 opacity-60" />
                <span className="font-medium">No image available</span>
              </div>
            )}
          </div>
          {images.length > 1 ? (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {images.slice(0, 4).map((img, index) => (
                <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-slate-200">
                  <Image src={img} alt={`${product.name} ${index + 1}`} fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
            {product.category?.name}
          </p>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">{product.name}</h1>
          <p className="text-slate-700 mb-6 leading-relaxed">{product.description}</p>
          <div className="text-3xl font-bold text-[var(--brand-navy)] mb-2">
            {finalPrice.toLocaleString()} RWF
          </div>
          {product.discount ? (
            <p className="text-sm text-slate-500 line-through mb-4">{product.price.toLocaleString()} RWF</p>
          ) : null}
          <p className="text-sm text-slate-700 mb-6">
            <span className="font-medium">SKU:</span> {product.sku ?? 'N/A'} ·{' '}
            <span className={product.stock > 0 ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </p>
          <div className="flex flex-wrap gap-3">
            <AddToCartButton
              productId={product.id}
              name={product.name}
              price={finalPrice}
              stock={product.stock}
              image={images[0]}
              className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
            />
            <Link href="/shop">
              <Button size="lg" variant="outline" className="border-slate-300 text-slate-800 hover:bg-slate-50">
                Back to shop
              </Button>
            </Link>
          </div>
          <p className="text-xs text-slate-600 mt-3 leading-relaxed">
            Open the cart (top bar) to submit your order with contact details for delivery or pickup in Kigali.
          </p>
          {specs.length > 0 && (
            <Card className="mt-8 border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {specs.map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-800">{key}</span>
                    <span className="text-slate-600">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Related Products</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {related.map((item) => (
              <Card key={item.id} className="overflow-hidden border-slate-200 bg-white">
                {item.images?.[0] ? (
                  <div className="relative h-32">
                    <Image src={item.images[0]} alt={item.name} fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="h-32 bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-medium">
                    No image
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-base text-slate-900">{item.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={`/shop/${item.id}`}>
                    <Button variant="outline" size="sm" className="border-slate-300 text-slate-800 hover:bg-slate-50">
                      View
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
      <SiteFooter />
    </>
  )
}
