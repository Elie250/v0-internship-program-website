import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  paginatedResponse,
  parseOptionalUuid,
  parsePagination,
  sanitizeSearchTerm,
} from '@/lib/shop/staff-api/common'
import { stripProductCostFields } from '@/lib/shop/staff-api/cost-policy'
import {
  formatSellingUnit,
  resolveSellingUnitFields,
  type SellingUnit,
} from '@/lib/shop/selling-unit'
import { isDuplicateBarcodeError, parseProductBarcode } from '@/lib/shop/product-barcode'
import { parseProductImages } from '@/lib/shop/product-images'

const PRODUCT_SELECT =
  'id, name, description, sku, barcode, category_id, price, discount, cost_price, stock, status, images, low_stock_threshold, selling_quantity, selling_unit, is_featured, created_at, updated_at, category:categories(id, name, slug, type)'

const PRODUCT_SELECT_NO_BARCODE =
  'id, name, description, sku, category_id, price, discount, cost_price, stock, status, images, low_stock_threshold, selling_quantity, selling_unit, is_featured, created_at, updated_at, category:categories(id, name, slug, type)'

const PRODUCT_SELECT_NO_FEATURED =
  'id, name, description, sku, barcode, category_id, price, discount, cost_price, stock, status, images, low_stock_threshold, selling_quantity, selling_unit, created_at, updated_at, category:categories(id, name, slug, type)'

const PRODUCT_SELECT_NO_FEATURED_NO_BARCODE =
  'id, name, description, sku, category_id, price, discount, cost_price, stock, status, images, low_stock_threshold, selling_quantity, selling_unit, created_at, updated_at, category:categories(id, name, slug, type)'

const PRODUCT_SELECT_LEGACY =
  'id, name, description, sku, barcode, category_id, price, discount, cost_price, stock, status, images, low_stock_threshold, created_at, updated_at, category:categories(id, name, slug, type)'

const PRODUCT_SELECT_LEGACY_NO_BARCODE =
  'id, name, description, sku, category_id, price, discount, cost_price, stock, status, images, low_stock_threshold, created_at, updated_at, category:categories(id, name, slug, type)'

export type StaffProductDto = {
  id: string
  name: string
  description: string | null
  sku: string | null
  barcode: string | null
  categoryId: string | null
  category: { id: string; name: string; slug: string | null; type: string | null } | null
  price: number
  discount: number
  /** Present only when caller has shop:products. */
  costPrice?: number
  stock: number
  status: string | null
  images: unknown
  lowStockThreshold: number | null
  targetStock: number | null
  sellingQuantity: number
  sellingUnit: string
  sellingUnitLabel: string
  isFeatured: boolean
  createdAt: string | null
  updatedAt: string | null
}

export type StaffProductQueryOptions = {
  /** When false, costPrice is omitted from the response (products_view-only). */
  includeCost?: boolean
}

function mapProduct(row: Record<string, unknown>, includeCost: boolean): StaffProductDto {
  const category = row.category as Record<string, unknown> | null | undefined
  const selling = resolveSellingUnitFields(row)
  const mapped: StaffProductDto = {
    id: String(row.id),
    name: String(row.name ?? ''),
    description: row.description != null ? String(row.description) : null,
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
    stock: Number(row.stock ?? 0),
    status: row.status != null ? String(row.status) : null,
    images: row.images ?? [],
    lowStockThreshold:
      row.low_stock_threshold != null ? Number(row.low_stock_threshold) : null,
    targetStock: row.target_stock != null ? Number(row.target_stock) : null,
    sellingQuantity: selling.sellingQuantity,
    sellingUnit: selling.sellingUnit,
    sellingUnitLabel: formatSellingUnit(selling.sellingQuantity, selling.sellingUnit),
    isFeatured: Boolean(row.is_featured),
    createdAt: row.created_at != null ? String(row.created_at) : null,
    updatedAt: row.updated_at != null ? String(row.updated_at) : null,
  }
  if (includeCost) {
    mapped.costPrice = Number(row.cost_price ?? 0)
  }
  return includeCost ? mapped : (stripProductCostFields(mapped) as StaffProductDto)
}

export async function listStaffProducts(
  searchParams: URLSearchParams,
  options: StaffProductQueryOptions = {}
) {
  const includeCost = Boolean(options.includeCost)
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
    if (/barcode/i.test(error.message)) {
      return listStaffProductsWithSelect(searchParams, includeCost, PRODUCT_SELECT_NO_BARCODE, {
        barcode: true,
      })
    }
    if (/\bis_featured\b/i.test(error.message)) {
      return listStaffProductsWithSelect(searchParams, includeCost, PRODUCT_SELECT_NO_FEATURED, {
        barcode: true,
      })
    }
    if (/selling_quantity|selling_unit/i.test(error.message)) {
      return listStaffProductsWithSelect(searchParams, includeCost, PRODUCT_SELECT_LEGACY, {
        barcode: false,
      })
    }
    return { error: 'Failed to load products', httpStatus: 500 as const }
  }

  return {
    httpStatus: 200 as const,
    body: paginatedResponse({
      items: (data ?? []).map((row) =>
        mapProduct(row as unknown as Record<string, unknown>, includeCost)
      ),
      page,
      limit,
      total: count ?? 0,
    }),
  }
}

async function listStaffProductsWithSelect(
  searchParams: URLSearchParams,
  includeCost: boolean,
  select: string,
  options: { barcode: boolean }
) {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 as const }
  const { page, limit, offset } = parsePagination(searchParams)
  const q = sanitizeSearchTerm(searchParams.get('q') || '')
  const sku = sanitizeSearchTerm(searchParams.get('sku') || '', 64)
  const barcode = options.barcode
    ? sanitizeSearchTerm(searchParams.get('barcode') || '', 64)
    : ''
  const status = searchParams.get('status')?.trim() || ''
  const categoryId = parseOptionalUuid(searchParams.get('category_id'))

  let query = supabaseAdmin.from('products').select(select, { count: 'exact' })
  if (status && status !== 'all') query = query.eq('status', status)
  else if (!status) query = query.eq('status', 'published')
  if (categoryId) query = query.eq('category_id', categoryId)
  if (sku) query = query.ilike('sku', `%${sku}%`)
  if (options.barcode && barcode) query = query.eq('barcode', barcode)
  if (q) {
    query = options.barcode
      ? query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%`)
      : query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
  }

  const { data, error, count } = await query
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    if (
      options.barcode === false &&
      /\bis_featured\b/i.test(error.message)
    ) {
      return listStaffProductsWithSelect(
        searchParams,
        includeCost,
        PRODUCT_SELECT_NO_FEATURED_NO_BARCODE,
        { barcode: false }
      )
    }
    if (options.barcode && /\bis_featured\b/i.test(error.message)) {
      return listStaffProductsWithSelect(searchParams, includeCost, PRODUCT_SELECT_NO_FEATURED, {
        barcode: true,
      })
    }
    if (
      options.barcode === false &&
      /selling_quantity|selling_unit/i.test(error.message)
    ) {
      return listStaffProductsWithSelect(
        searchParams,
        includeCost,
        PRODUCT_SELECT_LEGACY_NO_BARCODE,
        { barcode: false }
      )
    }
    if (options.barcode && /selling_quantity|selling_unit/i.test(error.message)) {
      return listStaffProductsWithSelect(searchParams, includeCost, PRODUCT_SELECT_LEGACY, {
        barcode: true,
      })
    }
    return { error: 'Failed to load products', httpStatus: 500 as const }
  }

  return {
    httpStatus: 200 as const,
    body: paginatedResponse({
      items: (data ?? []).map((row) =>
        mapProduct(
          options.barcode
            ? (row as unknown as Record<string, unknown>)
            : { ...(row as unknown as Record<string, unknown>), barcode: null },
          includeCost
        )
      ),
      page,
      limit,
      total: count ?? 0,
    }),
  }
}

export async function getStaffProductById(
  id: string,
  options: StaffProductQueryOptions = {}
) {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 as const }
  if (!parseOptionalUuid(id)) return { error: 'Invalid product id', httpStatus: 400 as const }
  const includeCost = Boolean(options.includeCost)

  const attempts: { select: string; barcodeMissing: boolean }[] = [
    { select: PRODUCT_SELECT, barcodeMissing: false },
    { select: PRODUCT_SELECT_NO_BARCODE, barcodeMissing: true },
    { select: PRODUCT_SELECT_NO_FEATURED, barcodeMissing: false },
    { select: PRODUCT_SELECT_NO_FEATURED_NO_BARCODE, barcodeMissing: true },
    { select: PRODUCT_SELECT_LEGACY, barcodeMissing: false },
    { select: PRODUCT_SELECT_LEGACY_NO_BARCODE, barcodeMissing: true },
  ]

  for (const attempt of attempts) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(attempt.select)
      .eq('id', id)
      .maybeSingle()
    if (error) {
      const missingBarcode = /barcode/i.test(error.message)
      const missingFeatured = /\bis_featured\b/i.test(error.message)
      const missingSelling = /selling_quantity|selling_unit/i.test(error.message)
      if (missingBarcode || missingFeatured || missingSelling) continue
      return { error: 'Failed to load product', httpStatus: 500 as const }
    }
    if (!data) return { error: 'Product not found', httpStatus: 404 as const }
    return {
      httpStatus: 200 as const,
      body: {
        item: mapProduct(
          attempt.barcodeMissing
            ? { ...(data as object), barcode: null }
            : (data as unknown as Record<string, unknown>),
          includeCost
        ),
      },
    }
  }

  return { error: 'Failed to load product', httpStatus: 500 as const }
}

export async function updateStaffProductSellingUnit(
  id: string,
  input: { sellingQuantity: number; sellingUnit: SellingUnit; isFeatured?: boolean },
  options: StaffProductQueryOptions = {}
) {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 as const }
  if (!parseOptionalUuid(id)) return { error: 'Invalid product id', httpStatus: 400 as const }

  const patch: Record<string, unknown> = {
    selling_quantity: input.sellingQuantity,
    selling_unit: input.sellingUnit,
    updated_at: new Date().toISOString(),
  }
  if (typeof input.isFeatured === 'boolean') {
    patch.is_featured = input.isFeatured
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(patch)
    .eq('id', id)
    .select(PRODUCT_SELECT)
    .maybeSingle()

  if (error) {
    if (/selling_quantity|selling_unit/i.test(error.message)) {
      return { error: 'Selling unit is not available yet', httpStatus: 503 as const }
    }
    if (/\bis_featured\b/i.test(error.message)) {
      return { error: 'Storefront featured is not available yet', httpStatus: 503 as const }
    }
    return { error: 'Failed to update product', httpStatus: 500 as const }
  }
  if (!data) return { error: 'Product not found', httpStatus: 404 as const }

  return {
    httpStatus: 200 as const,
    body: {
      item: mapProduct(data as unknown as Record<string, unknown>, Boolean(options.includeCost)),
    },
  }
}

async function recordPriceHistory(input: {
  productId: string
  field: 'cost_price' | 'selling_price'
  oldValue: number | null
  newValue: number
  actorUserId: string
}) {
  if (!supabaseAdmin) return
  await supabaseAdmin.from('product_price_history').insert([
    {
      product_id: input.productId,
      field: input.field,
      old_value: input.oldValue,
      new_value: input.newValue,
      actor_user_id: input.actorUserId,
    },
  ])
}

export async function createStaffProduct(
  input: {
    name: string
    description?: string | null
    sku?: string | null
    barcode?: string | null
    categoryId?: string | null
    price?: number
    costPrice?: number
    status?: string
    images?: unknown
    lowStockThreshold?: number | null
    targetStock?: number | null
    sellingQuantity?: number
    sellingUnit?: SellingUnit
    isFeatured?: boolean
  },
  options: StaffProductQueryOptions & { actorUserId: string; canSetCost: boolean; canSetSelling: boolean }
) {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 as const }
  const name = input.name.trim()
  if (!name) return { error: 'Product name is required', httpStatus: 400 as const }
  const barcode = parseProductBarcode(input.barcode)
  if (!barcode.ok) return { error: barcode.error, httpStatus: 400 as const }
  const images = parseProductImages(input.images)
  if (!images.ok) return { error: images.error, httpStatus: 400 as const }

  const payload: Record<string, unknown> = {
    name,
    description: input.description?.trim() || null,
    sku: input.sku?.trim() || null,
    barcode: barcode.value,
    category_id: input.categoryId || null,
    status: input.status === 'draft' ? 'draft' : 'published',
    stock: 0,
    discount: 0,
    images: images.value,
    low_stock_threshold: input.lowStockThreshold ?? 5,
    selling_quantity: input.sellingQuantity ?? 1,
    selling_unit: input.sellingUnit ?? 'PCS',
    is_featured: Boolean(input.isFeatured),
  }
  if (input.targetStock != null) payload.target_stock = Math.max(0, Math.trunc(input.targetStock))
  if (options.canSetSelling && input.price != null) payload.price = input.price
  else payload.price = input.price != null && options.canSetSelling ? input.price : 0
  if (options.canSetCost && input.costPrice != null) payload.cost_price = input.costPrice

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert([payload])
    .select(PRODUCT_SELECT)
    .single()

  if (error) {
    if (isDuplicateBarcodeError(error.message) || /duplicate|unique/i.test(error.message)) {
      return { error: 'A product with that SKU or barcode already exists', httpStatus: 409 as const }
    }
    return { error: 'Failed to create product', httpStatus: 400 as const }
  }

  if (options.canSetSelling && data.price != null) {
    await recordPriceHistory({
      productId: String(data.id),
      field: 'selling_price',
      oldValue: null,
      newValue: Number(data.price),
      actorUserId: options.actorUserId,
    })
  }
  if (options.canSetCost && data.cost_price != null) {
    await recordPriceHistory({
      productId: String(data.id),
      field: 'cost_price',
      oldValue: null,
      newValue: Number(data.cost_price),
      actorUserId: options.actorUserId,
    })
  }

  return {
    httpStatus: 201 as const,
    body: {
      item: mapProduct(data as unknown as Record<string, unknown>, Boolean(options.includeCost)),
    },
  }
}

export async function updateStaffProduct(
  id: string,
  input: {
    name?: string
    description?: string | null
    sku?: string | null
    barcode?: string | null
    categoryId?: string | null
    images?: unknown
    status?: string
    lowStockThreshold?: number | null
    targetStock?: number | null
    sellingQuantity?: number
    sellingUnit?: SellingUnit
    isFeatured?: boolean
    price?: number
    costPrice?: number
  },
  options: StaffProductQueryOptions & {
    actorUserId: string
    canManageProduct: boolean
    canSetCost: boolean
    canSetSelling: boolean
  }
) {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 as const }
  if (!parseOptionalUuid(id)) return { error: 'Invalid product id', httpStatus: 400 as const }

  const existing = await getStaffProductById(id, { includeCost: true })
  if (!('body' in existing) || !existing.body) return existing
  const current = existing.body.item

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  let touchesProduct = false
  let nextPrice: number | undefined
  let nextCost: number | undefined

  if (input.name !== undefined) {
    if (!options.canManageProduct) return { error: 'Forbidden', httpStatus: 403 as const }
    const name = input.name.trim()
    if (!name) return { error: 'Product name is required', httpStatus: 400 as const }
    patch.name = name
    touchesProduct = true
  }
  if (input.sku !== undefined) {
    if (!options.canManageProduct) return { error: 'Forbidden', httpStatus: 403 as const }
    patch.sku = input.sku?.trim() || null
    touchesProduct = true
  }
  if (input.description !== undefined) {
    if (!options.canManageProduct) return { error: 'Forbidden', httpStatus: 403 as const }
    patch.description = input.description?.trim() || null
    touchesProduct = true
  }
  if (input.barcode !== undefined) {
    if (!options.canManageProduct) return { error: 'Forbidden', httpStatus: 403 as const }
    const barcode = parseProductBarcode(input.barcode)
    if (!barcode.ok) return { error: barcode.error, httpStatus: 400 as const }
    patch.barcode = barcode.value
    touchesProduct = true
  }
  if (input.images !== undefined) {
    if (!options.canManageProduct) return { error: 'Forbidden', httpStatus: 403 as const }
    const images = parseProductImages(input.images)
    if (!images.ok) return { error: images.error, httpStatus: 400 as const }
    patch.images = images.value
    touchesProduct = true
  }
  if (input.categoryId !== undefined) {
    if (!options.canManageProduct) return { error: 'Forbidden', httpStatus: 403 as const }
    patch.category_id = input.categoryId || null
    touchesProduct = true
  }
  if (input.status !== undefined) {
    if (!options.canManageProduct) return { error: 'Forbidden', httpStatus: 403 as const }
    if (!['draft', 'published', 'archived'].includes(input.status)) {
      return { error: 'Invalid status', httpStatus: 400 as const }
    }
    patch.status = input.status
    touchesProduct = true
  }
  if (input.lowStockThreshold !== undefined) {
    if (!options.canManageProduct) return { error: 'Forbidden', httpStatus: 403 as const }
    patch.low_stock_threshold = input.lowStockThreshold
    touchesProduct = true
  }
  if (input.targetStock !== undefined) {
    if (!options.canManageProduct) return { error: 'Forbidden', httpStatus: 403 as const }
    patch.target_stock = input.targetStock
    touchesProduct = true
  }
  if (input.sellingQuantity !== undefined || input.sellingUnit !== undefined) {
    if (!options.canManageProduct) return { error: 'Forbidden', httpStatus: 403 as const }
    if (input.sellingQuantity !== undefined) patch.selling_quantity = input.sellingQuantity
    if (input.sellingUnit !== undefined) patch.selling_unit = input.sellingUnit
    touchesProduct = true
  }
  if (input.isFeatured !== undefined) {
    if (!options.canManageProduct) return { error: 'Forbidden', httpStatus: 403 as const }
    patch.is_featured = input.isFeatured
    touchesProduct = true
  }
  if (input.price !== undefined) {
    if (!options.canSetSelling) return { error: 'Forbidden', httpStatus: 403 as const }
    if (!Number.isFinite(input.price) || input.price < 0) {
      return { error: 'Invalid selling price', httpStatus: 400 as const }
    }
    patch.price = input.price
    nextPrice = input.price
  }
  if (input.costPrice !== undefined) {
    if (!options.canSetCost) return { error: 'Forbidden', httpStatus: 403 as const }
    if (!Number.isFinite(input.costPrice) || input.costPrice < 0) {
      return { error: 'Invalid cost price', httpStatus: 400 as const }
    }
    patch.cost_price = input.costPrice
    nextCost = input.costPrice
  }

  if (!touchesProduct && nextPrice === undefined && nextCost === undefined) {
    return { error: 'No product changes provided', httpStatus: 400 as const }
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(patch)
    .eq('id', id)
    .select(PRODUCT_SELECT)
    .maybeSingle()

  if (error) {
    if (isDuplicateBarcodeError(error.message) || /duplicate|unique/i.test(error.message)) {
      return { error: 'A product with that SKU or barcode already exists', httpStatus: 409 as const }
    }
    return { error: 'Failed to update product', httpStatus: 500 as const }
  }
  if (!data) return { error: 'Product not found', httpStatus: 404 as const }

  if (nextPrice !== undefined && nextPrice !== current.price) {
    await recordPriceHistory({
      productId: id,
      field: 'selling_price',
      oldValue: current.price,
      newValue: nextPrice,
      actorUserId: options.actorUserId,
    })
  }
  if (nextCost !== undefined && nextCost !== (current.costPrice ?? 0)) {
    await recordPriceHistory({
      productId: id,
      field: 'cost_price',
      oldValue: current.costPrice ?? null,
      newValue: nextCost,
      actorUserId: options.actorUserId,
    })
  }

  return {
    httpStatus: 200 as const,
    body: {
      item: mapProduct(data as unknown as Record<string, unknown>, Boolean(options.includeCost)),
    },
  }
}

export async function archiveStaffProduct(
  id: string,
  options: StaffProductQueryOptions = {}
) {
  return updateStaffProduct(
    id,
    { status: 'archived' },
    {
      includeCost: options.includeCost,
      actorUserId: '',
      canManageProduct: true,
      canSetCost: false,
      canSetSelling: false,
    }
  )
}
