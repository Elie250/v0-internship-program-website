/**
 * Shop portal shell nav permission self-check (Phase 1C.4).
 * Run: pnpm test:shop-shell
 */
import assert from 'node:assert/strict'
import test from 'node:test'

const PERMISSIONS = {
  SHOP_PRODUCTS: 'shop:products',
  SHOP_POS_SELL: 'shop:pos_sell',
  SHOP_SALES_VIEW: 'shop:sales_view',
  SHOP_STOCK_VIEW: 'shop:stock_view',
  SHOP_ORDERS_VIEW: 'shop:orders_view',
}

const SHOP_NAV_ITEMS = [
  { href: '/dashboard', permissions: [] },
  { href: '/pos', permissions: [PERMISSIONS.SHOP_POS_SELL] },
  { href: '/products', permissions: [PERMISSIONS.SHOP_PRODUCTS] },
  { href: '/inventory', permissions: [PERMISSIONS.SHOP_STOCK_VIEW] },
  {
    href: '/sales',
    permissions: [PERMISSIONS.SHOP_SALES_VIEW, PERMISSIONS.SHOP_ORDERS_VIEW],
  },
  { href: '/settings', permissions: [] },
]

function hasPermission(permissions, required) {
  if (!permissions?.length) return false
  const list = Array.isArray(required) ? required : [required]
  return list.some((p) => permissions.includes(p))
}

function canSee(permissions, item) {
  if (!item.permissions.length) return true
  return hasPermission(permissions, item.permissions)
}

function filterNav(permissions) {
  return SHOP_NAV_ITEMS.filter((item) => canSee(permissions, item))
}

test('salesperson sees POS and sales but not products by default', () => {
  const perms = [
    PERMISSIONS.SHOP_POS_SELL,
    PERMISSIONS.SHOP_SALES_VIEW,
    PERMISSIONS.SHOP_STOCK_VIEW,
    PERMISSIONS.SHOP_ORDERS_VIEW,
  ]
  const hrefs = filterNav(perms).map((i) => i.href)
  assert.ok(hrefs.includes('/dashboard'))
  assert.ok(hrefs.includes('/pos'))
  assert.ok(hrefs.includes('/inventory'))
  assert.ok(hrefs.includes('/sales'))
  assert.ok(hrefs.includes('/settings'))
  assert.equal(hrefs.includes('/products'), false)
})

test('inventory manager sees products and inventory but not POS', () => {
  const perms = [
    PERMISSIONS.SHOP_PRODUCTS,
    PERMISSIONS.SHOP_STOCK_VIEW,
  ]
  const hrefs = filterNav(perms).map((i) => i.href)
  assert.ok(hrefs.includes('/products'))
  assert.ok(hrefs.includes('/inventory'))
  assert.equal(hrefs.includes('/pos'), false)
  assert.equal(hrefs.includes('/sales'), false)
})

test('dashboard and settings remain visible to any authenticated staff', () => {
  const hrefs = filterNav([]).map((i) => i.href)
  assert.deepEqual(hrefs, ['/dashboard', '/settings'])
})
