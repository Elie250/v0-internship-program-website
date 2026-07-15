import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPublishedProducts } from '@/lib/platform/queries'
import { COMPANY } from '@/lib/company/constants'
import { HomeSectionHeader } from '@/components/home/home-section-header'
import {
  SectionShuffleSlots,
  type ShuffleCardItem,
} from '@/components/home/section-shuffle-slots'

export async function ShopTeaserSection() {
  const products = await getPublishedProducts()
  if (products.length === 0) return null

  const items: ShuffleCardItem[] = products.slice(0, 24).map((product) => ({
    id: product.id,
    title: product.name,
    subtitle: product.description || undefined,
    href: `/shop/${product.id}`,
    imageUrl: product.images?.[0] || null,
    ctaLabel:
      product.price != null ? `${Number(product.price).toLocaleString()} RWF` : 'View in shop',
  }))

  return (
    <section id="shop" className="home-section home-section--compact home-section--muted">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <HomeSectionHeader
            eyebrow="Products"
            title="Engineering supplies"
            description={`Components and tools from the ${COMPANY.brandName} shop for labs and field work.`}
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
        <SectionShuffleSlots items={items} slots={3} />
      </div>
    </section>
  )
}
