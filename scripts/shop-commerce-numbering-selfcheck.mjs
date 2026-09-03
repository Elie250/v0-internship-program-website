/**
 * Phase 1E.1 — unified commerce order numbering self-checks (no DB).
 * Run: pnpm test:shop-numbering
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

const UNIFIED_RE = /^EL-[A-Z0-9]{2,4}-\d{8}-\d{4,}$/
const HISTORICAL_RE = /^(POS|EL)-[A-Z0-9]+-[A-Z0-9]+$/

function normalize(raw) {
  return String(raw).trim().toUpperCase()
}

function isUnified(raw) {
  return UNIFIED_RE.test(normalize(raw))
}

function isHistorical(raw) {
  const value = normalize(raw)
  if (isUnified(value)) return false
  return HISTORICAL_RE.test(value)
}

function formatUnified(shortCode, yyyymmdd, sequence) {
  return `EL-${String(shortCode).trim().toUpperCase()}-${yyyymmdd}-${String(sequence).padStart(4, '0')}`
}

/** Mirrors INSERT … ON CONFLICT last_seq + 1 (POS and online share the key). */
function allocateSharedSequence(state, locationId, businessDate) {
  const key = `${locationId}|${businessDate}`
  const next = (state.get(key) ?? 0) + 1
  state.set(key, next)
  return next
}

test('numbering module and migration exist', () => {
  for (const rel of [
    'scripts/89-shop-commerce-order-numbering.sql',
    'lib/shop/commerce-order-number.ts',
    'lib/shop/commerce-checkout.ts',
    'lib/shop/locations.ts',
  ]) {
    assert.ok(existsSync(join(root, rel)), `missing ${rel}`)
  }
})

test('migration seeds NYZ, sequences, RPC, and unique order_number', () => {
  const sql = read('scripts/89-shop-commerce-order-numbering.sql')
  assert.match(sql, /short_code/)
  assert.match(sql, /'NYZ'/)
  assert.match(sql, /WHERE code = 'NYANZA'/)
  assert.match(sql, /CREATE TABLE IF NOT EXISTS commerce_order_sequences/)
  assert.match(sql, /PRIMARY KEY \(location_id, business_date\)/)
  assert.match(sql, /CREATE OR REPLACE FUNCTION shop_next_order_number/)
  assert.match(sql, /p_location_id UUID/)
  assert.match(sql, /Africa\/Kigali/)
  assert.match(
    sql,
    /ON CONFLICT \(location_id, business_date\)[\s\S]*last_seq = seq\.last_seq \+ 1/
  )
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_unique_idx/)
  assert.match(sql, /WHERE order_number IS NOT NULL/)
  assert.match(sql, /lpad\(next_seq::text, 4, '0'\)/)
  assert.match(sql, /'EL-'/)
})

test('migration does not rewrite history or split inventory', () => {
  const sql = read('scripts/89-shop-commerce-order-numbering.sql')
  assert.doesNotMatch(sql, /UPDATE\s+orders\s+SET\s+order_number/i)
  assert.doesNotMatch(sql, /product_location_stock/i)
  assert.doesNotMatch(sql, /staff_shop_assignments/i)
  assert.doesNotMatch(sql, /UPDATE\s+products\s+SET\s+stock/i)
  assert.match(sql, /Does NOT/i)
  assert.match(sql, /historical/i)
})

test('unified format EL-NYZ-YYYYMMDD-NNNN is valid', () => {
  assert.equal(formatUnified('NYZ', '20260827', 1), 'EL-NYZ-20260827-0001')
  assert.equal(formatUnified('nyz', '20260827', 12), 'EL-NYZ-20260827-0012')
  assert.ok(isUnified('EL-NYZ-20260827-0001'))
  assert.ok(isUnified('el-nyz-20260827-0001'))
  assert.ok(isUnified(formatUnified('NYZ', '20260827', 10000)))
  assert.equal(isUnified('POS-M5K8X2-AB3F'), false)
  assert.equal(isUnified('EL-M5K8X2-XY9Z'), false)
})

test('historical POS-* and EL-* codes remain recognized', () => {
  assert.ok(isHistorical('POS-M5K8X2-AB3F'))
  assert.ok(isHistorical('POS-MTBASVXP-4R68'))
  assert.ok(isHistorical('EL-M5K8X2-XY9Z'))
  assert.equal(isHistorical('EL-NYZ-20260827-0001'), false)
  assert.equal(isHistorical(''), false)
})

test('POS and online share one per-shop per-day sequence', () => {
  const state = new Map()
  const loc = 'nyanza-id'
  const day = '2026-08-27'
  const pos = allocateSharedSequence(state, loc, day)
  const online = allocateSharedSequence(state, loc, day)
  const pos2 = allocateSharedSequence(state, loc, day)
  assert.equal(pos, 1)
  assert.equal(online, 2)
  assert.equal(pos2, 3)
  assert.equal(formatUnified('NYZ', '20260827', pos), 'EL-NYZ-20260827-0001')
  assert.equal(formatUnified('NYZ', '20260827', online), 'EL-NYZ-20260827-0002')
  const otherDay = allocateSharedSequence(state, loc, '2026-08-28')
  assert.equal(otherDay, 1)
})

test('createCommerceSale uses PostgreSQL numbering after idempotency gate', () => {
  const src = read('lib/shop/commerce-checkout.ts')
  assert.match(src, /allocateCommerceOrderNumber/)
  assert.doesNotMatch(src, /generateOrderNumber/)
  const fnStart = src.indexOf('export async function createCommerceSale')
  assert.ok(fnStart >= 0)
  const body = src.slice(fnStart)
  const idempotencyAt = body.indexOf('beginIdempotentRequest')
  const allocateAt = body.indexOf('allocateCommerceOrderNumber')
  assert.ok(
    idempotencyAt >= 0 && allocateAt > idempotencyAt,
    'replay must run before allocation'
  )
  assert.match(src, /gate\.kind === 'replay'/)
  assert.match(src, /replay:\s*true/)
})

test('allocator calls shop_next_order_number and validates unified format', () => {
  const src = read('lib/shop/commerce-order-number.ts')
  assert.match(src, /rpc\('shop_next_order_number'/)
  assert.match(src, /p_location_id/)
  assert.match(src, /resolveShopPortalPosLocation/)
  assert.match(src, /isUnifiedCommerceOrderNumber/)
  assert.match(src, /UNIFIED_COMMERCE_ORDER_NUMBER_RE/)
  assert.doesNotMatch(src, /generateOrderNumber/)
  assert.doesNotMatch(src, /Math\.random/)
})

test('Nyanza short code is NYZ and machine code stays NYANZA', () => {
  const loc = read('lib/shop/locations.ts')
  assert.match(loc, /NYANZA:\s*'NYANZA'/)
  assert.match(loc, /NYANZA:\s*'NYZ'/)
  assert.match(read('lib/shop/order-lookup.ts'), /eq\('order_number'/)
  assert.match(read('lib/shop/order-lookup.ts'), /normalizeOrderCode/)
})

test('public lookup still keys on order_number not UUID', () => {
  const src = read('lib/shop/order-lookup.ts')
  assert.match(src, /\.eq\('order_number', orderNumber\)/)
  assert.doesNotMatch(src, /unit_cost|cost_price/)
  const page = read('app/receipt/[code]/page.tsx')
  assert.match(page, /lookupOrder/)
})

test('package.json exposes test:shop-numbering', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(
    pkg.scripts['test:shop-numbering'],
    'node --test scripts/shop-commerce-numbering-selfcheck.mjs'
  )
})
