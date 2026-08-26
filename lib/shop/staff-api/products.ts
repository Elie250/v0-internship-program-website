import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  paginatedResponse,
  parseOptionalUuid,
  parsePagination,
  sanitizeSearchTerm,
} from '@/lib/shop/staff-api/common'

const PRODUCT_SELECT =
  'id, name, sku, barcode, category_id, price, discount, cost_price, stock, status, images, low_stock_threshold, created_at, updated_at, category:categories(id, name, slug, type)'

export type StaffProductDto = {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  categoryId: string | null
  category: { id: string; name: string; slug: string | null; type: string | null } | null
  price: number
  discount: number
  costPrice: number
  stock: number
  status: string | null
  images: unknown
  lowStockThreshold: number | null
  createdAt: string | null
  updatedAt: string | null
}

function mapProduct(row: Record<string, unknown>): StaffProductDto {
  const category = row.category as Record<string, unknown> | null | undefined
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    sku: row.sku != null ? String(row.sku) : null,
    barcode: row.barcode != null ? String(row.barcode) : null,
    categoryId: row.category_id != null ? String(row.category_id) : null,
    category: category
      ? {
          id: String(category.id),
          name: String(category.name ?? ''),
          slug: category.slug != null ? String(category.slug) : null,
          type: category.type != null ? String(category.type) : null,
        }
      : null,
    price: Number(row.price ?? 0),
    discount: Number(row.discount ?? 0),
    costPrice: Number(row.cost_price ?? 0),
    stock: Number(row.stock ?? 0),
    status: row.status != null ? String(row.status) : null,
    images: row.images ?? [],
    lowStockThreshold:
      row.low_stock_threshold != null ? Number(row.low_stock_threshold) : null,
    createdAt: row.created_at != null ? String(row.created_at) : null,
    updatedAt: row.updated_at != null ? String(row.updated_at) : null,
  }
}

export async function listStaffProducts(searchParams: URLSearchParams) {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 as const }

  const { page, limit, offset } = parsePagination(searchParams)
  const q = sanitizeSearchTerm(searchParams.get('q') || '')
  const sku = sanitizeSearchTerm(searchParams.get('sku') || '', 64)
  const barcode = sanitizeSearchTerm(searchParams.get('barcode') || '', 64)
  const status = searchParams.get('status')?.trim() || ''
  const categoryId = parseOptionalUuid(searchParams.get('category_id'))
  if (searchParams.get('category_id') && !categoryId) {
    return { error: 'Invalid category_id', httpStatus: 400 as const }
  }

  let query = supabaseAdmin
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  } else if (!status) {
    query = query.eq('status', 'published')
  }

  if (categoryId) query = query.eq('category_id', categoryId)
  if (sku) query = query.ilike('sku', `%${sku}%`)
  if (barcode) query = query.eq('barcode', barcode)
  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%`)
  }

  const { data, error, count } = await query
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    // barcode column may be missing if migration 86 not applied
    if (/barcode/i.test(error.message)) {
      return listStaffProductsWithoutBarcode(searchParams)
    }
    return { error: 'Failed to load products', httpStatus: 500 as const }
  }

  return {
    httpStatus: 200 as const,
    body: paginatedResponse({
      items: (data ?? []).map((row) => mapProduct(row as Record<string, unknown>)),
      page,
      limit,
      total: count ?? 0,
    }),
  }
}

async function listStaffProductsWithoutBarcode(searchParams: URLSearchParams) {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 as const }
  const { page, limit, offset } = parsePagination(searchParams)
  const q = sanitizeSearchTerm(searchParams.get('q') || '')
  const sku = sanitizeSearchTerm(searchParams.get('sku') || '', 64)
  const status = searchParams.get('status')?.trim() || ''
  const categoryId = parseOptionalUuid(searchParams.get('category_id'))

  const select =
    'id, name, sku, category_id, price, discount, cost_price, stock, status, images, low_stock_threshold, created_at, updated_at, category:categories(id, name, slug, type)'

  let query = supabaseAdmin.from('products').select(select, { count: 'exact' })
  if (status && status !== 'all') query = query.eq('status', status)
  else if (!status) query = query.eq('status', 'published')
  if (categoryId) query = query.eq('category_id', categoryId)
  if (sku) query = query.ilike('sku', `%${sku}%`)
  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`)

  const { data, error, count } = await query
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) return { error: 'Failed to load products', httpStatus: 500 as const }

  return {
    httpStatus: 200 as const,
    body: paginatedResponse({
      items: (data ?? []).map((row) =>
        mapProduct({ ...(row as Record<string, unknown>), barcode: null })
      ),
      page,
      limit,
      total: count ?? 0,
    }),
  }
}

export async function getStaffProductById(id: string) {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 as const }
  if (!parseOptionalUuid(id)) return { error: 'Invalid product id', httpStatus: 400 as const }

  const { data, error } = await supabaseAdmin
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    if (/barcode/i.test(error.message)) {
      const fallback = await supabaseAdmin
        .from('products')
        .select(
          'id, name, sku, category_id, price, discount, cost_price, stock, status, images, low_stock_threshold, created_at, updated_at, category:categories(id, name, slug, type)'
        )
        .eq('id', id)
        .maybeSingle()
      if (fallback.error) return { error: 'Failed to load product', httpStatus: 500 as const }
      if (!fallback.data) return { error: 'Product not found', httpStatus: 404 as const }
      return {
        httpStatus: 200 as const,
        body: { item: mapProduct({ ...(fallback.data as object), barcode: null }) },
      }
    }
    return { error: 'Failed to load product', httpStatus: 500 as const }
  }

  if (!data) return { error: 'Product not found', httpStatus: 404 as const }
  return { httpStatus: 200 as const, body: { item: mapProduct(data as Record<string, unknown>) } }
}
