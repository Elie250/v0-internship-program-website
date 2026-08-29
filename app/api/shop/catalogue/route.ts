import { NextResponse } from 'next/server'
import { loadPublicCatalogue } from '@/lib/shop/public-catalogue'

/**
 * Public storefront catalogue for the Android shop (and any other client).
 * Same payload as the web storefront — no cost, staff fields, or product UUIDs.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const categorySlug = url.searchParams.get('category')?.trim() || undefined
  const search = url.searchParams.get('q')?.trim() || undefined

  const result = await loadPublicCatalogue({ categorySlug, search })
  if (result.error) {
    return NextResponse.json(
      { error: 'The product list could not be loaded. Please try again shortly.' },
      { status: 503 }
    )
  }

  return NextResponse.json({
    products: result.products,
    categories: result.categories,
  })
}
