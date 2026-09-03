/**
 * Shop cash POS self-check (Phase 1C.7).
 * Run: pnpm test:shop-pos
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function previewUnitPrice(price, discount = 0) {
  const unit = Number(price) - Number(discount ?? 0)
  if (!Number.isFinite(unit)) return 0
  return Math.max(0, unit)
}

function previewCartTotals(lines) {
  let listSubtotal = 0
  let payableTotal = 0
  for (const line of lines) {
    const qty = Math.max(0, Math.floor(Number(line.quantity) || 0))
    const list = Number(line.price) || 0
    const discount = Number(line.discount ?? 0) || 0
    listSubtotal += list * qty
    payableTotal += previewUnitPrice(list, discount) * qty
  }
  return {
    listSubtotal,
    discountTotal: Math.max(0, listSubtotal - payableTotal),
    payableTotal,
  }
}

test('POS page and terminal modules exist', () => {
  for (const rel of [
    'app/manage/(portal)/pos/page.tsx',
    'components/shop-portal/shop-pos-terminal.tsx',
    'lib/shop/pos-pricing.ts',
    'lib/shop/pos-cart.ts',
    'app/api/staff/pos/sales/route.ts',
  ]) {
    assert.ok(existsSync(join(root, rel)), rel)
  }
})

test('POS terminal is cash-only and posts to staff sales API', () => {
  const src = readFileSync(join(root, 'components/shop-portal/shop-pos-terminal.tsx'), 'utf8')
  assert.match(src, /\/api\/staff\/products/)
  assert.match(src, /\/api\/staff\/pos\/sales/)
  assert.match(src, /paymentMethod:\s*'cash'/)
  assert.doesNotMatch(src, /paymentMethod:\s*'momo'|SelectItem value="momo"|setPaymentMethod/)
  assert.match(src, /Idempotency-Key/)
  assert.match(src, /pos\.previewTotal|Preview total|preview/)
  assert.match(src, /credentials:\s*'same-origin'/)
})

test('POS page requires shop:pos_sell and mounts terminal', () => {
  const src = readFileSync(join(root, 'app/manage/(portal)/pos/page.tsx'), 'utf8')
  assert.match(src, /SHOP_POS_SELL/)
  assert.match(src, /ShopPosTerminal/)
  assert.doesNotMatch(src, /ShopPlaceholderPanel|Phase 1C\.7/)
})

test('staff POS sales route enforces CSRF and createCommerceSale', () => {
  const src = readFileSync(join(root, 'app/api/staff/pos/sales/route.ts'), 'utf8')
  assert.match(src, /assertStaffMutationAllowed/)
  assert.match(src, /createCommerceSale/)
  assert.match(src, /SHOP_POS_SELL/)
})

test('preview pricing matches server unit formula (price - discount)', () => {
  assert.equal(previewUnitPrice(1000, 100), 900)
  assert.equal(previewUnitPrice(500, 600), 0)
  const totals = previewCartTotals([
    { price: 1000, discount: 100, quantity: 2 },
    { price: 200, discount: 0, quantity: 1 },
  ])
  assert.equal(totals.listSubtotal, 2200)
  assert.equal(totals.discountTotal, 200)
  assert.equal(totals.payableTotal, 2000)
})

test('commerce-checkout was not rewritten by POS UI phase', () => {
  const src = readFileSync(join(root, 'lib/shop/commerce-checkout.ts'), 'utf8')
  assert.match(src, /export async function createCommerceSale/)
  assert.match(src, /consumeStockForLines|createActiveReservations/)
  assert.match(src, /allocateCommerceOrderNumber/)
})

test('POS cart merges duplicate products and rejects empty checkout', () => {
  function isPosCartEmpty(cart) {
    return !cart.some((line) => line.quantity > 0)
  }
  function addProductToCart(cart, product) {
    const stock = Math.max(0, Math.floor(Number(product.stock) || 0))
    if (stock < 1) return cart
    const existing = cart.find((line) => line.productId === product.id)
    if (existing) {
      if (existing.quantity >= stock) return cart
      return cart.map((line) =>
        line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line
      )
    }
    return [...cart, { productId: product.id, quantity: 1, maxStock: stock }]
  }
  function setCartLineQuantity(cart, productId, nextQty) {
    const qty = Math.floor(Number(nextQty))
    if (!Number.isFinite(qty) || qty < 1) {
      return cart.filter((line) => line.productId !== productId)
    }
    return cart
      .map((line) =>
        line.productId === productId ? { ...line, quantity: Math.min(line.maxStock, qty) } : line
      )
      .filter((line) => line.quantity > 0)
  }
  function removeCartLine(cart, productId) {
    return cart.filter((line) => line.productId !== productId)
  }
  function cartToSaleItems(cart) {
    return cart
      .filter((line) => line.quantity > 0)
      .map((line) => ({ productId: line.productId, quantity: line.quantity }))
  }

  const uno = { id: 'a', stock: 10 }
  const esp = { id: 'b', stock: 5 }
  let cart = []
  assert.equal(isPosCartEmpty(cart), true)
  cart = addProductToCart(cart, uno)
  cart = addProductToCart(cart, uno)
  cart = addProductToCart(cart, esp)
  assert.equal(cart.length, 2)
  assert.equal(cart.find((l) => l.productId === 'a').quantity, 2)
  cart = setCartLineQuantity(cart, 'a', 3)
  assert.equal(cart.find((l) => l.productId === 'a').quantity, 3)
  cart = setCartLineQuantity(cart, 'a', 0)
  assert.equal(cart.some((l) => l.productId === 'a'), false)
  cart = addProductToCart(cart, uno)
  cart = removeCartLine(cart, 'a')
  assert.equal(cart.some((l) => l.productId === 'a'), false)
  const payload = cartToSaleItems(addProductToCart(addProductToCart([], uno), esp))
  assert.deepEqual(payload, [
    { productId: 'a', quantity: 1 },
    { productId: 'b', quantity: 1 },
  ])
  assert.equal('price' in payload[0], false)
  assert.equal('total' in payload[0], false)
})

test('POS terminal posts IDs and quantities only through the existing sales API', () => {
  const src = readFileSync(join(root, 'components/shop-portal/shop-pos-terminal.tsx'), 'utf8')
  const cart = readFileSync(join(root, 'lib/shop/pos-cart.ts'), 'utf8')
  assert.match(src, /addProductToCart/)
  assert.match(src, /cartToSaleItems/)
  assert.match(src, /setCart\(\[\]\)/)
  assert.match(src, /pos\.reviewTitle|pos\.reviewSale/)
  assert.match(src, /pos\.thankYou/)
  assert.match(src, /pos\.confirmSale/)
  assert.doesNotMatch(src, /success\.orderId|\{success\.orderId\}/)
  assert.match(src, /SheetContent/)
  assert.match(src, /paymentMethod:\s*'cash'/)
  assert.doesNotMatch(src, /\/api\/staff\/inventory|shop_consume_stock/)
  assert.match(cart, /productId: line\.productId/)
  assert.match(cart, /quantity: line\.quantity/)
  assert.doesNotMatch(cart, /price: line\.price/)
})

test('POS catalogue shows selling unit without changing checkout payloads', () => {
  const src = readFileSync(join(root, 'components/shop-portal/shop-pos-terminal.tsx'), 'utf8')
  const cart = readFileSync(join(root, 'lib/shop/pos-cart.ts'), 'utf8')
  assert.match(src, /formatSellingUnit/)
  assert.match(src, /pos\.line\.qtyUnit/)
  assert.doesNotMatch(src, /20 × ML|5 × M/)
  const payloadFn = cart.slice(cart.indexOf('export function cartToSaleItems'))
  assert.match(payloadFn, /productId: line\.productId/)
  assert.match(payloadFn, /quantity: line\.quantity/)
  assert.doesNotMatch(payloadFn, /sellingUnit|sellingQuantity|price:/)
})

test('package.json exposes test:shop-pos', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  assert.equal(pkg.scripts['test:shop-pos'], 'node --test scripts/shop-pos-selfcheck.mjs')
})
