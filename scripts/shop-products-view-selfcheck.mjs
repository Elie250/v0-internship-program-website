/**
 * shop:products_view migration self-check (Phase 1C.5.x).
 * Run: pnpm test:shop-products-view
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sql88 = join(root, 'scripts/88-shop-products-view-permission.sql')
const sql86 = join(root, 'scripts/86-commerce-pos-foundation.sql')
const sql87 = join(root, 'scripts/87-shop-locations-foundation.sql')

test('migration 88 introduces shop:products_view without rewriting stock', () => {
  assert.ok(existsSync(sql88))
  const sql = readFileSync(sql88, 'utf8')
  assert.match(sql, /shop:products_view/)
  assert.match(sql, /salesperson/)
  assert.doesNotMatch(sql, /product_location_stock/)
  assert.doesNotMatch(sql, /CREATE TABLE products/i)
  assert.doesNotMatch(sql, /ALTER TABLE products/i)
})

test('migrations 86 and 87 do not define products_view (left unchanged)', () => {
  assert.ok(existsSync(sql86))
  assert.ok(existsSync(sql87))
  assert.doesNotMatch(readFileSync(sql86, 'utf8'), /shop:products_view/)
  assert.doesNotMatch(readFileSync(sql87, 'utf8'), /shop:products_view/)
})
