/**
 * Phase 1D.2 — Shop Staff Management UI self-checks.
 * Run: pnpm test:shop-staff-ui
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (rel) => readFileSync(join(root, rel), 'utf8')

test('Staff Management page exists and requires shop admin', () => {
  const page = 'app/manage/(portal)/users/page.tsx'
  assert.ok(existsSync(join(root, page)))
  const src = read(page)
  assert.match(src, /requireShopPortalAdmin/)
  assert.match(src, /ShopForbiddenPanel/)
  assert.match(src, /ShopStaffPanel/)
  assert.match(src, /Staff Management/)
})

test('requireShopPortalAdmin gates on role === admin', () => {
  const src = read('lib/shop/portal-session.ts')
  assert.match(src, /requireShopPortalAdmin/)
  assert.match(src, /role !== 'admin'/)
})

test('Staff nav item is admin-only', () => {
  const src = read('lib/shop/portal-nav.ts')
  assert.match(src, /href: '\/users'/)
  assert.match(src, /adminOnly:\s*true/)
  assert.match(src, /label: 'Staff'/)
  assert.match(src, /if \(item\.adminOnly\) return role === 'admin'/)
})

test('salesperson and inventory_manager cannot see Staff nav', () => {
  const PERMISSIONS = {
    SHOP_POS_SELL: 'shop:pos_sell',
    SHOP_PRODUCTS_VIEW: 'shop:products_view',
    SHOP_PRODUCTS: 'shop:products',
    SHOP_SALES_VIEW: 'shop:sales_view',
    SHOP_STOCK_VIEW: 'shop:stock_view',
    SHOP_ORDERS_VIEW: 'shop:orders_view',
  }
  const items = [
    { href: '/dashboard', permissions: [], adminOnly: false },
    { href: '/pos', permissions: [PERMISSIONS.SHOP_POS_SELL], adminOnly: false },
    { href: '/users', permissions: [], adminOnly: true },
    { href: '/settings', permissions: [], adminOnly: false },
  ]
  function canSee(permissions, item, role) {
    if (item.adminOnly) return role === 'admin'
    if (!item.permissions.length) return true
    return item.permissions.some((p) => permissions.includes(p))
  }
  const salesperson = [
    PERMISSIONS.SHOP_POS_SELL,
    PERMISSIONS.SHOP_PRODUCTS_VIEW,
    PERMISSIONS.SHOP_SALES_VIEW,
    PERMISSIONS.SHOP_STOCK_VIEW,
    PERMISSIONS.SHOP_ORDERS_VIEW,
  ]
  const inventory = [PERMISSIONS.SHOP_PRODUCTS, PERMISSIONS.SHOP_STOCK_VIEW]
  assert.equal(
    items.filter((i) => canSee(salesperson, i, 'salesperson')).some((i) => i.href === '/users'),
    false
  )
  assert.equal(
    items.filter((i) => canSee(inventory, i, 'inventory_manager')).some((i) => i.href === '/users'),
    false
  )
  assert.equal(
    items.filter((i) => canSee([], i, 'admin')).some((i) => i.href === '/users'),
    true
  )
})

test('staff panel uses Phase 1D.1 APIs and never renders secrets', () => {
  const src = read('components/shop-portal/shop-staff-panel.tsx')
  assert.match(src, /\/api\/staff\/users/)
  assert.match(src, /method: 'POST'/)
  assert.match(src, /method: 'PATCH'/)
  assert.match(src, /\/reset-password/)
  assert.match(src, /\/revoke-sessions/)
  assert.match(src, /newPassword/)
  assert.doesNotMatch(src, /password_hash|supabaseAdmin|SERVICE_ROLE|session\.token|Bearer /)
  assert.doesNotMatch(src, /value=\{['"]admin['"]\}|>admin</)
  // Create role select must not offer admin
  assert.match(src, /salesperson/)
  assert.match(src, /inventory_manager/)
})

test('create staff UI rejects admin role option', () => {
  const src = read('components/shop-portal/shop-staff-panel.tsx')
  assert.match(src, /staff\.create\.desc|cannot be created here/)
  const createRolesBlock = src.slice(
    src.indexOf('const CREATE_ROLE_VALUES'),
    src.indexOf('const ALLOWED_CREATE_ROLES')
  )
  assert.ok(createRolesBlock.length > 0, 'CREATE_ROLE_VALUES block missing')
  assert.doesNotMatch(createRolesBlock, /admin/)
  assert.match(src, /CREATE_ROLE_KEYS/)
})

test('proxy and hosts still include /users for shop host rewrite', () => {
  assert.match(read('lib/shop/hosts.ts'), /'\/users'/)
  const proxy = read('proxy.ts')
  assert.match(proxy, /modules = \[[^\]]*'users'[^\]]*\]/)
  // Matcher must include /users or proxy never runs and shop host returns 404
  assert.match(proxy, /matcher:\s*\[[\s\S]*?'\/users'[\s\S]*?'\/users\/:path\*'/)
})

test('Staff UI uses Shop i18n (no hardcoded Create Staff chrome)', () => {
  const src = read('components/shop-portal/shop-staff-panel.tsx')
  assert.match(src, /useShopT/)
  assert.match(src, /t\('staff\.create'\)/)
  assert.match(src, /t\('action\.edit'\)/)
  assert.doesNotMatch(src, /Create Staff/)
})

test('layout filters nav with role for adminOnly Staff item', () => {
  const src = read('app/manage/(portal)/layout.tsx')
  assert.match(src, /filterShopNavItems\(session\.user\.permissions,\s*session\.user\.role\)/)
})

test('staff panel is client-only and uses fetchStaffApi', () => {
  const src = read('components/shop-portal/shop-staff-panel.tsx')
  assert.match(src, /^'use client'/m)
  assert.match(src, /fetchStaffApi/)
  assert.doesNotMatch(src, /from '@\/lib\/supabaseAdmin'/)
  assert.doesNotMatch(src, /from '@\/lib\/shop\/staff-users'/)
})

test('package.json exposes test:shop-staff-ui', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.scripts['test:shop-staff-ui'], 'node --test scripts/shop-staff-ui-selfcheck.mjs')
})
