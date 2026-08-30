/**
 * Shop products / inventory / sales read UI self-check (Phase 1C.8).
 * Run: pnpm test:shop-read-ui
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const FILES = [
  'app/manage/(portal)/products/page.tsx',
  'app/manage/(portal)/inventory/page.tsx',
  'app/manage/(portal)/sales/page.tsx',
  'components/shop-portal/shop-products-panel.tsx',
  'components/shop-portal/shop-inventory-panel.tsx',
  'components/shop-portal/shop-sales-panel.tsx',
  'lib/shop/staff-client.ts',
]

test('read UI modules exist', () => {
  for (const rel of FILES) {
    assert.ok(existsSync(join(root, rel)), rel)
  }
})

test('panels call staff APIs only (no supabase in browser panels)', () => {
  for (const rel of [
    'components/shop-portal/shop-products-panel.tsx',
    'components/shop-portal/shop-inventory-panel.tsx',
    'components/shop-portal/shop-sales-panel.tsx',
    'lib/shop/staff-client.ts',
  ]) {
    const src = readFileSync(join(root, rel), 'utf8')
    assert.doesNotMatch(src, /supabaseAdmin|createClient|from\('products'\)/)
    assert.match(src, /\/api\/staff\//)
  }
})

test('products panel uses product endpoints and selling-unit PATCH is manager-only', () => {
  const src = readFileSync(join(root, 'components/shop-portal/shop-products-panel.tsx'), 'utf8')
  assert.match(src, /\/api\/staff\/products/)
  assert.match(src, /products\.readOnlyNote/)
  assert.match(src, /canSeeCost/)
  assert.match(src, /method:\s*'PATCH'/)
  assert.match(src, /sellingQuantity/)
  assert.match(src, /sellingUnit/)
  assert.match(src, /isFeatured/)
  assert.match(src, /canSeeCost/)
  assert.match(src, /products\.field\.featured/)
  assert.match(src, /method:\s*'POST'/)
  assert.match(src, /lowStockThreshold/)
  assert.match(src, /targetStock/)
  assert.match(src, /products\.receiveStock/)
  assert.doesNotMatch(src, /stock:\s*Number\(|currentStock|on hand count/)
  assert.doesNotMatch(src, /cost_price/)
})

test('inventory panel covers levels, movements, and stock mutations', () => {
  const src = readFileSync(join(root, 'components/shop-portal/shop-inventory-panel.tsx'), 'utf8')
  const en = readFileSync(join(root, 'lib/shop/i18n/messages/en.ts'), 'utf8')
  assert.match(src, /\/api\/staff\/inventory/)
  assert.match(src, /\/api\/staff\/inventory\/movements/)
  assert.match(src, /\/api\/staff\/inventory\/receive/)
  assert.match(src, /\/api\/staff\/inventory\/adjust/)
  assert.match(src, /productId/)
  assert.match(src, /inventory\.receiveExplain/)
  assert.doesNotMatch(en, /Adjustments and transfers are not available yet/)
  assert.doesNotMatch(src, /transfers are not available yet/i)
})

test('sales panel uses orders list and detail', () => {
  const src = readFileSync(join(root, 'components/shop-portal/shop-sales-panel.tsx'), 'utf8')
  assert.match(src, /\/api\/staff\/orders/)
  assert.match(src, /\/api\/staff\/orders\/\$\{/)
  assert.doesNotMatch(src, /method:\s*'POST'|method:\s*'PATCH'/)
})

test('pages wire panels and remove placeholders', () => {
  for (const rel of [
    'app/manage/(portal)/products/page.tsx',
    'app/manage/(portal)/inventory/page.tsx',
    'app/manage/(portal)/sales/page.tsx',
  ]) {
    const src = readFileSync(join(root, rel), 'utf8')
    assert.doesNotMatch(src, /ShopPlaceholderPanel|Phase 1C\.8/)
  }
  assert.match(
    readFileSync(join(root, 'app/manage/(portal)/products/page.tsx'), 'utf8'),
    /ShopProductsPanel|STAFF_API_PERMISSIONS\.products/
  )
  assert.match(
    readFileSync(join(root, 'app/manage/(portal)/inventory/page.tsx'), 'utf8'),
    /ShopInventoryPanel/
  )
  assert.match(
    readFileSync(join(root, 'app/manage/(portal)/sales/page.tsx'), 'utf8'),
    /ShopSalesPanel|STAFF_API_PERMISSIONS\.orders/
  )
})

test('package.json exposes test:shop-read-ui', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  assert.equal(pkg.scripts['test:shop-read-ui'], 'node --test scripts/shop-read-ui-selfcheck.mjs')
})
