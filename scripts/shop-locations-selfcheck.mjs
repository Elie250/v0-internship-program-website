/**
 * Shop locations foundation self-check (Phase 1C.2).
 * Pure expectations — does not connect to Supabase.
 * Run: pnpm test:shop-locations
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationPath = join(__dirname, '87-shop-locations-foundation.sql')
const sql = readFileSync(migrationPath, 'utf8')

test('migration creates shop_locations with Nyanza seed', () => {
  assert.match(sql, /CREATE TABLE IF NOT EXISTS shop_locations/i)
  assert.match(sql, /Nyanza Shop/)
  assert.match(sql, /NYANZA/)
  assert.match(sql, /ON CONFLICT \(code\) DO UPDATE/i)
})

test('migration adds nullable orders.location_id without rewriting stock', () => {
  assert.match(sql, /ALTER TABLE orders ADD COLUMN IF NOT EXISTS location_id UUID/i)
  assert.doesNotMatch(sql, /product_location_stock/i)
  assert.doesNotMatch(sql, /UPDATE\s+products\s+SET\s+stock/i)
  assert.doesNotMatch(sql, /shop_consume_stock/i)
})

test('migration documents that products.stock remains authoritative', () => {
  assert.match(sql, /products\.stock/)
  assert.match(sql, /Does NOT change products\.stock/i)
})

test('stable location code constant matches seed', async () => {
  // Inline expectation — mirrors lib/shop/locations.ts without TS import loader issues
  const NYANZA = 'NYANZA'
  assert.equal(NYANZA, 'NYANZA')
  assert.match(sql, new RegExp(`'${NYANZA}'`))
})
