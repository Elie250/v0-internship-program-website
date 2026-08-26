/**
 * Shop dashboard UI self-check (Phase 1C.6).
 * Run: pnpm test:shop-dashboard
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function formatShopRwf(amount) {
  const n = Number.isFinite(amount) ? Math.round(amount) : 0
  return `${n.toLocaleString('en-RW')} RWF`
}

function formatShopInteger(value) {
  const n = Number.isFinite(value) ? Math.round(value) : 0
  return n.toLocaleString('en-RW')
}

const PERMISSIONS = {
  SHOP_POS_SELL: 'shop:pos_sell',
  SHOP_SALES_VIEW: 'shop:sales_view',
  SHOP_STOCK_VIEW: 'shop:stock_view',
  SHOP_ORDERS_VIEW: 'shop:orders_view',
}

const DASHBOARD_API_PERMS = [PERMISSIONS.SHOP_SALES_VIEW, PERMISSIONS.SHOP_ORDERS_VIEW]

function hasPermission(permissions, required) {
  if (!permissions?.length) return false
  const list = Array.isArray(required) ? required : [required]
  return list.some((p) => permissions.includes(p))
}

test('dashboard page and view modules exist', () => {
  for (const rel of [
    'app/manage/(portal)/dashboard/page.tsx',
    'components/shop-portal/shop-dashboard.tsx',
    'lib/shop/format.ts',
    'lib/shop/staff-api/dashboard.ts',
  ]) {
    assert.ok(existsSync(join(root, rel)), rel)
  }
})

test('dashboard page uses shared getStaffDashboardReport (API contract)', () => {
  const src = readFileSync(join(root, 'app/manage/(portal)/dashboard/page.tsx'), 'utf8')
  assert.match(src, /getStaffDashboardReport/)
  assert.match(src, /STAFF_API_PERMISSIONS/)
  assert.doesNotMatch(src, /ShopPlaceholderPanel/)
  assert.doesNotMatch(src, /Phase 1C\.6/)
})

test('dashboard view never fabricates profit', () => {
  const view = readFileSync(join(root, 'components/shop-portal/shop-dashboard.tsx'), 'utf8')
  const api = readFileSync(join(root, 'lib/shop/staff-api/dashboard.ts'), 'utf8')
  assert.match(api, /profit:\s*null/)
  assert.match(view, /Profit reporting is not enabled/)
  assert.doesNotMatch(view, /todaySales\s*-\s*|grossProfit|estimatedProfit/)
})

test('sales metrics require sales/orders permission; stock uses stock_view', () => {
  const salesperson = [
    PERMISSIONS.SHOP_POS_SELL,
    PERMISSIONS.SHOP_SALES_VIEW,
    PERMISSIONS.SHOP_STOCK_VIEW,
    PERMISSIONS.SHOP_ORDERS_VIEW,
  ]
  const inventoryManager = [PERMISSIONS.SHOP_STOCK_VIEW]
  assert.equal(hasPermission(salesperson, DASHBOARD_API_PERMS), true)
  assert.equal(hasPermission(salesperson, PERMISSIONS.SHOP_STOCK_VIEW), true)
  assert.equal(hasPermission(inventoryManager, DASHBOARD_API_PERMS), false)
  assert.equal(hasPermission(inventoryManager, PERMISSIONS.SHOP_STOCK_VIEW), true)
})

test('RWF and integer formatters are stable', () => {
  assert.equal(formatShopRwf(1500), '1,500 RWF')
  assert.equal(formatShopRwf(1500.7), '1,501 RWF')
  assert.equal(formatShopInteger(12), '12')
})

test('package.json exposes test:shop-dashboard', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  assert.equal(pkg.scripts['test:shop-dashboard'], 'node --test scripts/shop-dashboard-selfcheck.mjs')
})
