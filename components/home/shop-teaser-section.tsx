import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getPublishedProducts } from '@/lib/platform/queries'
import { COMPANY } from '@/lib/company/constants'
import { HomeSectionHeader } from '@/components/home/home-section-header'

export async function ShopTeaserSection() {
  const products = (await getPublishedProducts()).slice(0, 2)
  if (products.length === 0) return null

  return (
    <section id="shop" className="home-section home-section--compact home-section--muted">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <HomeSectionHeader
            eyebrow="Products"
            title="Engineering supplies"
            description={`Components and tools from ${COMPANY.brandName} — browse the shop.`}
            align="left"
            className="mb-0"
          />
          <Link href="/shop">
            <Button variant="outline" className="text-slate-800 border-slate-300">
              View shop
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
          {products.map((product) => {
            const image = product.images?.[0]
            return (
              <Link key={product.id} href={`/shop/${product.id}`} className="home-tile-link no-underline hover:no-underline">
                <Card className="h-full border-slate-200 hover:shadow-md transition-shadow overflow-hidden">
                  <div className="relative h-32 bg-slate-100">
                    {image ? (
                      <Image src={image} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-300">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <p className="font-semibold text-slate-900 text-sm line-clamp-2">{product.name}</p>
                    {product.price != null ? (
                      <p className="text-sm text-[var(--brand-navy)] font-medium mt-1">
                        {Number(product.price).toLocaleString()} RWF
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
