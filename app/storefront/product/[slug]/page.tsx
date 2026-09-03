import type { Metadata } from 'next'
import {
  StorefrontProductDetail,
  StorefrontProductMissing,
} from '@/components/storefront/storefront-product-detail'
import { getPublicCatalogueItemBySlug } from '@/lib/shop/public-catalogue'

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getPublicCatalogueItemBySlug(slug)
  if (!product) {
    return {
      title: 'Product | Energy & Logics Shop',
      robots: { index: false, follow: false },
    }
  }
  return {
    title: `${product.name} | Energy & Logics Shop`,
    robots: { index: true, follow: true },
  }
}

export default async function StorefrontProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getPublicCatalogueItemBySlug(slug)
  if (!product) {
    return <StorefrontProductMissing />
  }
  return <StorefrontProductDetail product={product} />
}
