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

test('products panel is read-only and uses product endpoints', () => {
  const src = readFileSync(join(root, 'components/shop-portal/shop-products-panel.tsx'), 'utf8')
  assert.match(src, /\/api\/staff\/products/)
  assert.match(src, /Read-only/)
  assert.doesNotMatch(src, /method:\s*'POST'|method:\s*'PATCH'|method:\s*'DELETE'/)
})

test('inventory panel covers levels and movements', () => {
  const src = readFileSync(join(root, 'components/shop-portal/shop-inventory-panel.tsx'), 'utf8')
  assert.match(src, /\/api\/staff\/inventory/)
  assert.match(src, /\/api\/staff\/inventory\/movements/)
  assert.doesNotMatch(src, /method:\s*'(POST|PATCH|PUT|DELETE)'/)
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
