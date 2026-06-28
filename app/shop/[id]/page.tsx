import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-2 gap-10">
        <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
          {product.images?.[0] ? (
            <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">No image</div>
          )}
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">{product.category?.name}</p>
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-4">{product.name}</h1>
          <p className="text-muted-foreground mb-6">{product.description}</p>
          <div className="text-2xl font-bold mb-2">{finalPrice.toLocaleString()} RWF</div>
          {product.discount ? (
            <p className="text-sm text-muted-foreground line-through mb-4">{product.price.toLocaleString()} RWF</p>
          ) : null}
          <p className="text-sm mb-6">SKU: {product.sku ?? 'N/A'} · Stock: {product.stock}</p>
          <Link href="/auth/register"><Button size="lg" className="bg-[#1e3a5f]">Purchase / Register</Button></Link>
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
              <Card key={item.id}>
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
    </main>
  )
}
