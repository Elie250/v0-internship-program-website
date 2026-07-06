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
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            {images[0] ? (
              <Image src={images[0]} alt={product.name} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                <Package className="h-12 w-12 opacity-50" />
                <span>No image available</span>
              </div>
            )}
          </div>
          {images.length > 1 ? (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {images.slice(0, 4).map((img, index) => (
                <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                  <Image src={img} alt={`${product.name} ${index + 1}`} fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">{product.category?.name}</p>
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-4">{product.name}</h1>
          <p className="text-muted-foreground mb-6">{product.description}</p>
          <div className="text-2xl font-bold mb-2">{finalPrice.toLocaleString()} RWF</div>
          {product.discount ? (
            <p className="text-sm text-muted-foreground line-through mb-4">{product.price.toLocaleString()} RWF</p>
          ) : null}
          <p className="text-sm mb-6">
            SKU: {product.sku ?? 'N/A'} ·{' '}
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </p>
          <div className="flex flex-wrap gap-3">
            <AddToCartButton
              productId={product.id}
              name={product.name}
              price={finalPrice}
              stock={product.stock}
              image={images[0]}
              className="bg-[#1e3a5f]"
            />
            <Link href="/shop">
              <Button size="lg" variant="outline">Back to shop</Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Open the cart (top bar) to submit your order with contact details for delivery or pickup in Kigali.
          </p>
          {specs.length > 0 && (
            <Card className="mt-8">
              <CardHeader><CardTitle>Specifications</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {specs.map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm border-b pb-2">
                    <span className="font-medium">{key}</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {related.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                {item.images?.[0] ? (
                  <div className="relative h-32">
                    <Image src={item.images[0]} alt={item.name} fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="h-32 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
                <CardHeader><CardTitle className="text-base">{item.name}</CardTitle></CardHeader>
                <CardContent>
                  <Link href={`/shop/${item.id}`}><Button variant="outline" size="sm">View</Button></Link>
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
