import { NextResponse } from 'next/server'
import { getPublicCatalogueItemBySlug } from '@/lib/shop/public-catalogue'

/** Public product detail by storefront slug. UUID lookups are rejected by the catalogue helper. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const item = await getPublicCatalogueItemBySlug(slug)
  if (!item) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
  return NextResponse.json({ item })
}
