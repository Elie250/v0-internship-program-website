/**
 * Shop portal shell nav permission self-check (Phase 1C.4 / 1C.8 / 1D.2).
 * Run: pnpm test:shop-shell
 */
import assert from 'node:assert/strict'
import test from 'node:test'

const PERMISSIONS = {
  SHOP_PRODUCTS: 'shop:products',
  SHOP_PRODUCTS_VIEW: 'shop:products_view',
  SHOP_POS_SELL: 'shop:pos_sell',
  SHOP_SALES_VIEW: 'shop:sales_view',
  SHOP_STOCK_VIEW: 'shop:stock_view',
  SHOP_ORDERS_VIEW: 'shop:orders_view',
}

const SHOP_NAV_ITEMS = [
  { href: '/dashboard', permissions: [], adminOnly: false },
  { href: '/orders', permissions: [PERMISSIONS.SHOP_ORDERS_VIEW], adminOnly: false },
  { href: '/pos', permissions: [PERMISSIONS.SHOP_POS_SELL], adminOnly: false },
  {
    href: '/products',
    permissions: [PERMISSIONS.SHOP_PRODUCTS_VIEW, PERMISSIONS.SHOP_PRODUCTS],
    adminOnly: false,
  },
  { href: '/inventory', permissions: [PERMISSIONS.SHOP_STOCK_VIEW], adminOnly: false },
  {
    href: '/sales',
    permissions: [PERMISSIONS.SHOP_SALES_VIEW, PERMISSIONS.SHOP_ORDERS_VIEW],
    adminOnly: false,
  },
  { href: '/users', permissions: [], adminOnly: true },
  { href: '/settings', permissions: [], adminOnly: false },
]

function hasPermission(permissions, required) {
  if (!permissions?.length) return false
  const list = Array.isArray(required) ? required : [required]
  return list.some((p) => permissions.includes(p))
}

function canSee(permissions, item, role) {
  if (item.adminOnly) return role === 'admin'
  if (!item.permissions.length) return true
  return hasPermission(permissions, item.permissions)
}

function filterNav(permissions, role) {
  return SHOP_NAV_ITEMS.filter((item) => canSee(permissions, item, role))
}

test('salesperson sees POS, catalog read, sales — not Staff management', () => {
  const perms = [
    PERMISSIONS.SHOP_POS_SELL,
    PERMISSIONS.SHOP_PRODUCTS_VIEW,
    PERMISSIONS.SHOP_SALES_VIEW,
    PERMISSIONS.SHOP_ORDERS_VIEW,
  ]
  const hrefs = filterNav(perms, 'salesperson').map((i) => i.href)
  assert.ok(hrefs.includes('/dashboard'))
  assert.ok(hrefs.includes('/orders'))
  assert.ok(hrefs.includes('/pos'))
  assert.ok(hrefs.includes('/products'))
  assert.equal(hrefs.includes('/inventory'), false)
  assert.ok(hrefs.includes('/sales'))
  assert.ok(hrefs.includes('/settings'))
  assert.equal(hrefs.includes('/users'), false)
})

test('inventory manager sees products and inventory but not POS or Staff', () => {
  const perms = [PERMISSIONS.SHOP_PRODUCTS, PERMISSIONS.SHOP_STOCK_VIEW]
  const hrefs = filterNav(perms, 'inventory_manager').map((i) => i.href)
  assert.ok(hrefs.includes('/products'))
  assert.ok(hrefs.includes('/inventory'))
  assert.equal(hrefs.includes('/pos'), false)
  assert.equal(hrefs.includes('/orders'), false)
  assert.equal(hrefs.includes('/sales'), false)
  assert.equal(hrefs.includes('/users'), false)
})

test('dashboard and settings remain visible to any authenticated staff', () => {
  const hrefs = filterNav([], 'salesperson').map((i) => i.href)
  assert.deepEqual(hrefs, ['/dashboard', '/settings'])
})

test('administrator sees Staff management nav', () => {
  const hrefs = filterNav([], 'admin').map((i) => i.href)
  assert.ok(hrefs.includes('/users'))
  assert.ok(hrefs.includes('/dashboard'))
  assert.ok(hrefs.includes('/settings'))
})
