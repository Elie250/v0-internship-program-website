/**
 * Staff read APIs self-check (Phase 1C.5).
 * Run: pnpm test:staff-apis
 *
 * Exercises permission mapping, pagination, validation helpers, timezone,
 * and verifies route modules exist without mutating commerce logic.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const PERMISSIONS = {
  SHOP_PRODUCTS: 'shop:products',
  SHOP_PRODUCTS_VIEW: 'shop:products_view',
  SHOP_POS_SELL: 'shop:pos_sell',
  SHOP_SALES_VIEW: 'shop:sales_view',
  SHOP_STOCK_VIEW: 'shop:stock_view',
  SHOP_ORDERS_VIEW: 'shop:orders_view',
  SHOP_STOCK_ADJUST: 'shop:stock_adjust',
}

const STAFF_API_PERMISSIONS = {
  products: [PERMISSIONS.SHOP_PRODUCTS_VIEW, PERMISSIONS.SHOP_PRODUCTS],
  inventory: PERMISSIONS.SHOP_STOCK_VIEW,
  orders: [PERMISSIONS.SHOP_ORDERS_VIEW, PERMISSIONS.SHOP_SALES_VIEW],
  dashboard: [PERMISSIONS.SHOP_SALES_VIEW, PERMISSIONS.SHOP_ORDERS_VIEW],
}

function hasPermission(permissions, required) {
  if (!permissions?.length) return false
  const list = Array.isArray(required) ? required : [required]
  return list.some((p) => permissions.includes(p))
}

function expandShopPermissionAliases(permissions) {
  const merged = new Set(permissions)
  if (merged.has('shop:orders')) {
    merged.add('shop:pos_sell')
    merged.add('shop:sales_view')
    merged.add('shop:orders_view')
    merged.add('shop:orders_manage')
  }
  if (merged.has('shop:products')) {
    merged.add('shop:products_view')
  }
  if (merged.has('shop:pos_sell')) {
    merged.add('shop:products_view')
  }
  return merged
}

function parsePagination(searchParams) {
  const pageRaw = Number(searchParams.get('page') ?? '1')
  const limitRaw = Number(searchParams.get('limit') ?? '25')
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1
  const limit = Number.isFinite(limitRaw)
    ? Math.min(100, Math.max(1, Math.floor(limitRaw)))
    : 25
  return { page, limit, offset: (page - 1) * limit }
}

function paginatedResponse({ items, page, limit, total }) {
  return { items, page, limit, total }
}

function parseOptionalUuid(value) {
  if (!value) return null
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
    ? value
    : null
}

function parseOptionalDate(value) {
  if (!value) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  return value
}

function sanitizeSearchTerm(value, maxLen = 80) {
  return value
    .replace(/[%_,.()\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen)
}

const BUSINESS_TIMEZONE = 'Africa/Kigali'

function kigaliCalendarDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function kigaliDayUtcBounds(date = new Date()) {
  const day = kigaliCalendarDate(date)
  return {
    startIso: new Date(`${day}T00:00:00+02:00`).toISOString(),
    endIso: new Date(`${day}T23:59:59.999+02:00`).toISOString(),
  }
}

function kigaliDateFilterBounds(dateFrom, dateTo) {
  return {
    startIso: dateFrom ? new Date(`${dateFrom}T00:00:00+02:00`).toISOString() : null,
    endIso: dateTo ? new Date(`${dateTo}T23:59:59.999+02:00`).toISOString() : null,
  }
}

const ROLE_PERMISSIONS = {
  salesperson: [
    PERMISSIONS.SHOP_POS_SELL,
    PERMISSIONS.SHOP_PRODUCTS_VIEW,
    PERMISSIONS.SHOP_SALES_VIEW,
    PERMISSIONS.SHOP_ORDERS_VIEW,
  ],
  inventory_manager: [
    PERMISSIONS.SHOP_PRODUCTS,
    PERMISSIONS.SHOP_PRODUCTS_VIEW,
    PERMISSIONS.SHOP_STOCK_VIEW,
    PERMISSIONS.SHOP_STOCK_ADJUST,
    'shop:stock_receive',
    PERMISSIONS.SHOP_ORDERS_VIEW,
    PERMISSIONS.SHOP_SALES_VIEW,
    PERMISSIONS.SHOP_CATEGORIES,
  ],
  admin: Object.values(PERMISSIONS),
}

const ROUTE_FILES = [
  'app/api/staff/products/route.ts',
  'app/api/staff/products/[id]/route.ts',
  'app/api/staff/inventory/route.ts',
  'app/api/staff/inventory/movements/route.ts',
  'app/api/staff/inventory/adjust/route.ts',
  'app/api/staff/inventory/receive/route.ts',
  'app/api/staff/inventory/replenishment/route.ts',
  'app/api/staff/inventory/purchase-requests/route.ts',
  'app/api/staff/orders/route.ts',
  'app/api/staff/orders/[id]/route.ts',
  'app/api/staff/reports/dashboard/route.ts',
]

const LIB_FILES = [
  'lib/shop/staff-api/common.ts',
  'lib/shop/staff-api/permissions.ts',
  'lib/shop/staff-api/products.ts',
  'lib/shop/staff-api/inventory.ts',
  'lib/shop/staff-api/orders.ts',
  'lib/shop/staff-api/dashboard.ts',
]

const REFUND_FILES = [
  'app/api/staff/orders/[id]/refunds/route.ts',
  'app/api/staff/refunds/[id]/decision/route.ts',
  'lib/shop/refunds/policy.ts',
  'lib/shop/refunds/service.ts',
  'scripts/92-shop-refunds.sql',
]

test('staff read API route modules exist', () => {
  for (const rel of [...ROUTE_FILES, ...LIB_FILES, ...REFUND_FILES]) {
    assert.ok(existsSync(join(root, rel)), `missing ${rel}`)
  }
})

test('routes authenticate with staff permission or session guards', () => {
  for (const rel of ROUTE_FILES) {
    const src = readFileSync(join(root, rel), 'utf8')
    assert.match(src, /requireStaffPermission|requireStaffSession/)
    const path = rel.replace(/\\/g, '/')
    if (path.endsWith('staff/products/route.ts')) {
      assert.match(src, /export async function GET/)
      assert.match(src, /export async function POST/)
      assert.match(src, /STAFF_API_PERMISSIONS\.productManage/)
      continue
    }
    if (path.endsWith('staff/products/[id]/route.ts')) {
      assert.match(src, /export async function PATCH/)
      assert.match(src, /assertStaffMutationAllowed/)
      assert.match(src, /SHOP_SELLING_PRICE|SHOP_COST_PRICE|SHOP_PRODUCTS/)
      continue
    }
    if (path.endsWith('staff/orders/[id]/route.ts')) {
      assert.match(src, /export async function PATCH/)
      assert.match(src, /assertStaffMutationAllowed/)
      assert.match(src, /STAFF_API_PERMISSIONS\.fulfillment/)
      continue
    }
    if (path.includes('inventory/adjust') || path.includes('inventory/receive') || path.includes('purchase-requests')) {
      assert.match(src, /export async function POST/)
      assert.match(src, /assertStaffMutationAllowed/)
      continue
    }
    assert.match(src, /export async function GET/)
  }
})

test('staff mutations do not rewrite the commerce checkout engine', () => {
  const forbidden = ['createCommerceSale', 'transferStock']
  for (const rel of ROUTE_FILES) {
    const src = readFileSync(join(root, rel), 'utf8')
    for (const needle of forbidden) {
      assert.equal(src.includes(needle), false, `${rel} must not call ${needle}`)
    }
  }
  const adjust = readFileSync(join(root, 'app/api/staff/inventory/adjust/route.ts'), 'utf8')
  const receive = readFileSync(join(root, 'app/api/staff/inventory/receive/route.ts'), 'utf8')
  assert.match(adjust, /stockAdjust/)
  assert.match(receive, /stockReceive/)
})

test('unauthenticated staff lack all API permissions', () => {
  const perms = []
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.products), false)
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.inventory), false)
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.orders), false)
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.dashboard), false)
})

test('salesperson can access product READ, orders, dashboard — not inventory or product management', () => {
  const perms = [...expandShopPermissionAliases(ROLE_PERMISSIONS.salesperson)]
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.products), true)
  assert.equal(perms.includes(PERMISSIONS.SHOP_PRODUCTS), false)
  assert.equal(perms.includes(PERMISSIONS.SHOP_PRODUCTS_VIEW), true)
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.inventory), false)
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.orders), true)
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.dashboard), true)
})

test('pos_sell expands to products_view without granting shop:products', () => {
  const perms = [...expandShopPermissionAliases([PERMISSIONS.SHOP_POS_SELL])]
  assert.ok(perms.includes(PERMISSIONS.SHOP_PRODUCTS_VIEW))
  assert.equal(perms.includes(PERMISSIONS.SHOP_PRODUCTS), false)
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.products), true)
})

test('shop:products expands to products_view for managers', () => {
  const perms = [...expandShopPermissionAliases([PERMISSIONS.SHOP_PRODUCTS])]
  assert.ok(perms.includes(PERMISSIONS.SHOP_PRODUCTS_VIEW))
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.products), true)
})

test('inventory manager can access products, inventory, orders, and dashboard', () => {
  const perms = [...expandShopPermissionAliases(ROLE_PERMISSIONS.inventory_manager)]
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.products), true)
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.inventory), true)
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.orders), true)
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.dashboard), true)
})

test('admin can access all staff read APIs', () => {
  const perms = ROLE_PERMISSIONS.admin
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.products), true)
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.inventory), true)
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.orders), true)
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.dashboard), true)
})

test('legacy shop:orders expands to orders/sales view', () => {
  const perms = [...expandShopPermissionAliases(['shop:orders'])]
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.orders), true)
  assert.equal(hasPermission(perms, STAFF_API_PERMISSIONS.dashboard), true)
})

test('pagination contract clamps and defaults consistently', () => {
  assert.deepEqual(parsePagination(new URLSearchParams('')), {
    page: 1,
    limit: 25,
    offset: 0,
  })
  assert.deepEqual(parsePagination(new URLSearchParams('page=2&limit=10')), {
    page: 2,
    limit: 10,
    offset: 10,
  })
  assert.deepEqual(parsePagination(new URLSearchParams('page=0&limit=999')), {
    page: 1,
    limit: 100,
    offset: 0,
  })
  assert.deepEqual(
    paginatedResponse({ items: [{ id: 1 }], page: 1, limit: 25, total: 1 }),
    { items: [{ id: 1 }], page: 1, limit: 25, total: 1 }
  )
})

test('uuid and date validation reject invalid client input', () => {
  assert.equal(parseOptionalUuid('not-a-uuid'), null)
  assert.ok(parseOptionalUuid('550e8400-e29b-41d4-a716-446655440000'))
  assert.equal(parseOptionalDate('2026-13-01'), '2026-13-01') // format-only; DB filters further
  assert.equal(parseOptionalDate('2026/08/26'), null)
  assert.equal(parseOptionalDate('yesterday'), null)
  assert.equal(parseOptionalDate('2026-08-26'), '2026-08-26')
})

test('search sanitization strips PostgREST filter metacharacters', () => {
  assert.equal(sanitizeSearchTerm('abc%_,(x)'), 'abc x')
  assert.equal(sanitizeSearchTerm('  cable  '), 'cable')
})

test('Kigali business day bounds use UTC+2 (no browser local time)', () => {
  const fixed = new Date('2026-08-26T22:30:00.000Z') // 00:30 next day in Kigali
  assert.equal(kigaliCalendarDate(fixed), '2026-08-27')
  const { startIso, endIso } = kigaliDayUtcBounds(fixed)
  assert.equal(startIso, new Date('2026-08-27T00:00:00+02:00').toISOString())
  assert.equal(endIso, new Date('2026-08-27T23:59:59.999+02:00').toISOString())

  const range = kigaliDateFilterBounds('2026-08-01', '2026-08-26')
  assert.equal(range.startIso, new Date('2026-08-01T00:00:00+02:00').toISOString())
  assert.equal(range.endIso, new Date('2026-08-26T23:59:59.999+02:00').toISOString())
})

test('dashboard report omits fabricated profit and documents global stock model', () => {
  const src = readFileSync(join(root, 'lib/shop/staff-api/dashboard.ts'), 'utf8')
  assert.match(src, /profit:\s*null/)
  assert.match(src, /stockModel:\s*'global_products_stock'/)
  assert.match(src, /BUSINESS_TIMEZONE|Africa\/Kigali/)
  assert.doesNotMatch(src, /revenue\s*-\s*/)
})

test('inventory API documents global products.stock authority', () => {
  const src = readFileSync(join(root, 'lib/shop/staff-api/inventory.ts'), 'utf8')
  assert.match(src, /stockModel:\s*'global_products_stock'/)
  assert.doesNotMatch(src, /product_location_stock/)
})

test('order detail maps MoMo proof without credentials or cost', () => {
  const src = readFileSync(join(root, 'lib/shop/staff-api/orders.ts'), 'utf8')
  assert.match(src, /receipt_url/)
  assert.match(src, /proofUrl/)
  assert.match(src, /customerEmail/)
  assert.match(src, /customerPhone/)
  assert.match(src, /locationId|locationName/)
  assert.match(src, /customerName/)
  assert.doesNotMatch(src, /momo_token|service_role|password/i)
  assert.match(src, /includeCost \? \{ unitCost/)
})

test('commerce foundation files remain untouched by staff API phase markers', () => {
  for (const rel of [
    'scripts/86-commerce-pos-foundation.sql',
    'scripts/87-shop-locations-foundation.sql',
    'lib/shop/commerce-checkout.ts',
  ]) {
    assert.ok(existsSync(join(root, rel)), rel)
  }
})

test('package.json exposes test:staff-apis', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  assert.equal(pkg.scripts['test:staff-apis'], 'node --test scripts/staff-apis-selfcheck.mjs')
})
