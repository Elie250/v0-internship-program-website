/**
 * Inventory / pricing / customer-session RBAC self-check.
 * Run: pnpm test:shop-inventory-rbac
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

const PERMISSIONS = {
  SHOP_PRODUCTS: 'shop:products',
  SHOP_PRODUCTS_VIEW: 'shop:products_view',
  SHOP_POS_SELL: 'shop:pos_sell',
  SHOP_SALES_VIEW: 'shop:sales_view',
  SHOP_STOCK_VIEW: 'shop:stock_view',
  SHOP_STOCK_ADJUST: 'shop:stock_adjust',
  SHOP_STOCK_RECEIVE: 'shop:stock_receive',
  SHOP_COST_PRICE: 'shop:cost_price',
  SHOP_SELLING_PRICE: 'shop:selling_price',
  SHOP_REPLENISHMENT_VIEW: 'shop:replenishment_view',
  SHOP_PURCHASE_REQUEST: 'shop:purchase_request',
  SHOP_ORDERS_VIEW: 'shop:orders_view',
  SHOP_ORDERS_MANAGE: 'shop:orders_manage',
}

function expandShopPermissionAliases(permissions) {
  const merged = new Set(permissions)
  if (merged.has('shop:products')) merged.add('shop:products_view')
  if (merged.has('shop:pos_sell')) merged.add('shop:products_view')
  return merged
}

function hasPermission(permissions, required) {
  const list = Array.isArray(required) ? required : [required]
  return list.some((key) => permissions.includes(key))
}

const salesperson = [
  PERMISSIONS.SHOP_POS_SELL,
  PERMISSIONS.SHOP_PRODUCTS_VIEW,
  PERMISSIONS.SHOP_SALES_VIEW,
  PERMISSIONS.SHOP_ORDERS_VIEW,
]
const inventoryManager = [
  PERMISSIONS.SHOP_PRODUCTS,
  PERMISSIONS.SHOP_PRODUCTS_VIEW,
  PERMISSIONS.SHOP_STOCK_VIEW,
  PERMISSIONS.SHOP_STOCK_ADJUST,
  PERMISSIONS.SHOP_STOCK_RECEIVE,
  PERMISSIONS.SHOP_COST_PRICE,
  PERMISSIONS.SHOP_SELLING_PRICE,
  PERMISSIONS.SHOP_REPLENISHMENT_VIEW,
  PERMISSIONS.SHOP_PURCHASE_REQUEST,
  PERMISSIONS.SHOP_ORDERS_VIEW,
  PERMISSIONS.SHOP_ORDERS_MANAGE,
]
const salespersonHelping = [...salesperson, PERMISSIONS.SHOP_STOCK_VIEW, PERMISSIONS.SHOP_STOCK_RECEIVE]

test('Test A — salesperson is POS-focused and has no inventory or prices', () => {
  const perms = [...expandShopPermissionAliases(salesperson)]
  assert.equal(hasPermission(perms, PERMISSIONS.SHOP_POS_SELL), true)
  assert.equal(hasPermission(perms, PERMISSIONS.SHOP_STOCK_VIEW), false)
  assert.equal(hasPermission(perms, PERMISSIONS.SHOP_PRODUCTS), false)
  assert.equal(hasPermission(perms, PERMISSIONS.SHOP_COST_PRICE), false)
  assert.equal(hasPermission(perms, PERMISSIONS.SHOP_SELLING_PRICE), false)
  const src = read('lib/admin/permissions.ts')
  const block = src.slice(src.indexOf('salesperson: ['), src.indexOf('inventory_manager: ['))
  assert.doesNotMatch(block, /SHOP_STOCK_VIEW/)
})

test('Test B — inventory manager has catalog, stock, prices, and replenishment', () => {
  const perms = [...expandShopPermissionAliases(inventoryManager)]
  assert.equal(hasPermission(perms, PERMISSIONS.SHOP_STOCK_VIEW), true)
  assert.equal(hasPermission(perms, PERMISSIONS.SHOP_PRODUCTS), true)
  assert.equal(hasPermission(perms, PERMISSIONS.SHOP_STOCK_ADJUST), true)
  assert.equal(hasPermission(perms, PERMISSIONS.SHOP_STOCK_RECEIVE), true)
  assert.equal(hasPermission(perms, PERMISSIONS.SHOP_COST_PRICE), true)
  assert.equal(hasPermission(perms, PERMISSIONS.SHOP_SELLING_PRICE), true)
  assert.equal(hasPermission(perms, PERMISSIONS.SHOP_REPLENISHMENT_VIEW), true)
})

test('Test C — salesperson can receive stock without product or price authority', () => {
  const perms = [...expandShopPermissionAliases(salespersonHelping)]
  assert.equal(hasPermission(perms, PERMISSIONS.SHOP_POS_SELL), true)
  assert.equal(hasPermission(perms, PERMISSIONS.SHOP_STOCK_VIEW), true)
  assert.equal(hasPermission(perms, PERMISSIONS.SHOP_STOCK_RECEIVE), true)
  assert.equal(hasPermission(perms, PERMISSIONS.SHOP_STOCK_ADJUST), false)
  assert.equal(hasPermission(perms, PERMISSIONS.SHOP_PRODUCTS), false)
  assert.equal(hasPermission(perms, PERMISSIONS.SHOP_COST_PRICE), false)
})

test('Test D — removing inventory extras drops inventory after next resolve', () => {
  const withInventory = [...expandShopPermissionAliases(salespersonHelping)]
  const revoked = [...expandShopPermissionAliases(salesperson)]
  assert.equal(hasPermission(withInventory, PERMISSIONS.SHOP_STOCK_VIEW), true)
  assert.equal(hasPermission(revoked, PERMISSIONS.SHOP_STOCK_VIEW), false)
  assert.equal(hasPermission(revoked, PERMISSIONS.SHOP_STOCK_RECEIVE), false)
})

test('staff product create accepts catalog fields and staff upload requires shop:products', () => {
  const create = read('app/api/staff/products/route.ts')
  const svc = read('lib/shop/staff-api/products.ts')
  const upload = read('app/api/staff/upload/route.ts')
  const mobile = read('apps/mobile/app/staff/products.tsx')
  const portal = read('components/shop-portal/shop-products-panel.tsx')
  assert.match(create, /description/)
  assert.match(create, /images/)
  assert.match(svc, /parseProductBarcode/)
  assert.match(svc, /parseProductImages/)
  assert.match(upload, /productManage/)
  assert.match(upload, /folder !== 'products'/)
  assert.match(mobile, /Scan barcode/)
  assert.match(mobile, /Take product photo/)
  assert.match(mobile, /uploadStaffProductImage/)
  assert.match(portal, /uploadPath="\/api\/staff\/upload"/)
  assert.match(portal, /createBarcode/)
})

test('Test E — mutation APIs require the matching shop:* permission', () => {
  const adjust = read('app/api/staff/inventory/adjust/route.ts')
  const receive = read('app/api/staff/inventory/receive/route.ts')
  const create = read('app/api/staff/products/route.ts')
  const patch = read('app/api/staff/products/[id]/route.ts')
  assert.match(adjust, /stockAdjust/)
  assert.match(receive, /stockReceive/)
  assert.match(create, /productManage/)
  assert.match(patch, /SHOP_PRODUCTS/)
  assert.match(patch, /SHOP_COST_PRICE/)
  assert.match(patch, /SHOP_SELLING_PRICE/)
  assert.match(adjust, /requireStaffPermission/)
  assert.match(receive, /requireStaffPermission/)
  assert.match(create, /requireStaffPermission/)
})

test('shop:products no longer grants stock adjustment', () => {
  const expanded = expandShopPermissionAliases(['shop:products'])
  assert.equal(expanded.has('shop:products_view'), true)
  assert.equal(expanded.has('shop:stock_view'), false)
  assert.equal(expanded.has('shop:stock_adjust'), false)
  const src = read('lib/admin/permissions.ts')
  const fn = src.slice(src.indexOf('export function expandShopPermissionAliases'))
  const productsBlock = fn.slice(fn.indexOf('SHOP_PRODUCTS'), fn.indexOf('SHOP_POS_SELL'))
  assert.doesNotMatch(productsBlock, /SHOP_STOCK_VIEW/)
  assert.doesNotMatch(productsBlock, /SHOP_STOCK_ADJUST/)
})

test('public GET /api/products does not select cost_price for customers', () => {
  const src = read('app/api/products/route.ts')
  assert.match(src, /publicSelect/)
  assert.match(src, /cost_price/)
  assert.doesNotMatch(src.split('status === \'all\' ? adminSelect : publicSelect')[1]?.slice(0, 80) ?? '', /cost_price/)
  assert.match(src, /publicSelect =\s*'[^']*price/)
  assert.doesNotMatch(src, /publicSelect =\s*'[^']*cost_price/)
})

test('admin DELETE archives products instead of hard-deleting', () => {
  const src = read('app/api/products/[id]/route.ts')
  assert.match(src, /status: 'archived'/)
  assert.doesNotMatch(src, /\.delete\(\)/)
})

test('shop staff editor writes filtered extras to users.permissions', () => {
  const users = read('lib/shop/staff-users.ts')
  const panel = read('components/shop-portal/shop-staff-panel.tsx')
  assert.match(users, /shopStaffStoredExtras/)
  assert.match(users, /customPermissions/)
  assert.match(panel, /ShopStaffPermissionMatrix/)
  assert.match(panel, /permissions: extras/)
  assert.match(read('lib/admin/user-mutations.ts'), /extrasToPreserveOnRoleChange/)
})

test('customer home is not hijacked by a staff token', () => {
  const index = read('apps/mobile/app/index.tsx')
  const header = read('apps/mobile/src/features/shop/ShopHeader.tsx')
  const account = read('apps/mobile/app/customer/account.tsx')
  assert.match(index, /\/customer/)
  assert.doesNotMatch(index, /token && user/)
  assert.match(header, /nav.trackOrder/)
  assert.match(header, /\/customer\/track/)
  assert.match(account, /account.track/)
  assert.match(account, /account.phone1/)
  assert.doesNotMatch(header, /\/login/)
})

test('additive inventory migration seeds the new shop:* keys', () => {
  const sql = read('scripts/93-shop-inventory-permissions.sql')
  assert.match(sql, /shop:stock_receive/)
  assert.match(sql, /shop:cost_price/)
  assert.match(sql, /shop:selling_price/)
  assert.match(sql, /shop:replenishment_view/)
  assert.match(sql, /shop:purchase_request/)
  assert.match(sql, /target_stock/)
  assert.match(sql, /product_price_history/)
  assert.match(sql, /shop_purchase_requests/)
  assert.match(sql, /shop_add_stock/)
  assert.doesNotMatch(sql, /DROP TABLE/)
  assert.doesNotMatch(sql, /DELETE FROM products/)
})

test('package.json exposes test:shop-inventory-rbac', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.scripts['test:shop-inventory-rbac'], 'node --test scripts/shop-inventory-rbac-selfcheck.mjs')
})
