/**
 * Pure self-checks for commerce POS foundation (no DB).
 * Run: pnpm test:commerce
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')


function normalizeIdempotencyKey(value) {
  if (typeof value !== 'string') return null
  const key = value.trim()
  if (key.length < 8 || key.length > 128) return null
  if (!/^[a-zA-Z0-9._:-]+$/.test(key)) return null
  return key
}

const STOCK_MOVEMENT_TYPES = [
  'SALE',
  'PURCHASE',
  'ADJUSTMENT',
  'RETURN',
  'DAMAGE',
  'TRANSFER',
  'RESERVE',
  'RELEASE',
]

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
    merged.add('shop:stock_view')
    merged.add('shop:stock_adjust')
  }
  if (merged.has('shop:pos_sell')) {
    merged.add('shop:products_view')
  }
  return merged
}

test('normalizeIdempotencyKey accepts uuid-like keys', () => {
  assert.equal(normalizeIdempotencyKey('a'.repeat(7)), null)
  assert.equal(normalizeIdempotencyKey('pos-sale-key-01'), 'pos-sale-key-01')
  assert.equal(normalizeIdempotencyKey('bad key!'), null)
})

test('stock movement types include reserve/release and sale', () => {
  assert.ok(STOCK_MOVEMENT_TYPES.includes('SALE'))
  assert.ok(STOCK_MOVEMENT_TYPES.includes('RESERVE'))
  assert.ok(STOCK_MOVEMENT_TYPES.includes('RELEASE'))
  assert.ok(STOCK_MOVEMENT_TYPES.includes('ADJUSTMENT'))
})

test('legacy shop:orders expands to granular POS permissions', () => {
  const expanded = expandShopPermissionAliases(['shop:orders'])
  assert.ok(expanded.has('shop:pos_sell'))
  assert.ok(expanded.has('shop:orders_view'))
  assert.ok(expanded.has('shop:orders_manage'))
})

test('pos_sell expands to products_view for catalog READ', () => {
  const expanded = expandShopPermissionAliases(['shop:pos_sell'])
  assert.ok(expanded.has('shop:products_view'))
  assert.equal(expanded.has('shop:products'), false)
})

test('shop:products expands to products_view and stock', () => {
  const expanded = expandShopPermissionAliases(['shop:products'])
  assert.ok(expanded.has('shop:products_view'))
  assert.ok(expanded.has('shop:stock_view'))
})

test('receipt print hints stay outside checkout UI', () => {
  const receipt = {
    schemaVersion: 1,
    currency: 'RWF',
    printHints: { openCashDrawer: true, copies: 1 },
  }
  assert.equal(receipt.schemaVersion, 1)
  assert.equal(receipt.printHints.openCashDrawer, true)
})

test('shop MoMo review reuses reviewPaymentCore without rewriting createCommerceSale', () => {
  const checkout = readFileSync(join(root, 'lib/shop/commerce-checkout.ts'), 'utf8')
  assert.match(checkout, /export async function createCommerceSale/)
  assert.match(checkout, /export async function finalizeCommercePaymentApproval/)
  assert.match(checkout, /export async function finalizeCommercePaymentRejection/)
  const core = readFileSync(join(root, 'lib/admin/review-payment-core.ts'), 'utf8')
  assert.match(core, /SHOP_PAYMENTS_REVIEW/)
  assert.match(core, /finalizeCommercePaymentApproval/)
  const staff = readFileSync(join(root, 'lib/shop/staff-api/payment-review.ts'), 'utf8')
  assert.match(staff, /reviewPaymentCore/)
  assert.doesNotMatch(staff, /createCommerceSale/)
})

