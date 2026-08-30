/**
 * Official shop receipt + customer email self-checks (no DB, no Resend).
 * Run: pnpm test:shop-receipt
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

const POS_PLACEHOLDER = 'pos@energyandlogics.com'
const UNIFIED_RE = /^EL-[A-Z0-9]{2,4}-\d{8}-\d{4,}$/

function isLikelyValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function isCustomerReceiptEmail(raw) {
  const email = String(raw ?? '').trim().toLowerCase()
  if (!email) return false
  if (email === POS_PLACEHOLDER) return false
  return isLikelyValidEmail(email)
}

test('receipt modules exist', () => {
  for (const rel of [
    'lib/shop/order-receipt.ts',
    'lib/shop/order-receipt-client.ts',
    'lib/shop/customer-receipt-email.ts',
    'lib/shop/send-confirmed-order-receipt.ts',
    'lib/email/shop-order-receipt.ts',
  ]) {
    assert.ok(existsSync(join(root, rel)), `missing ${rel}`)
  }
})

test('official receipt is MD-signed and uses current order number label', () => {
  const src = read('lib/shop/order-receipt.ts')
  assert.match(src, /Official order receipt/)
  assert.match(src, /Elie BISAMAZA/)
  assert.match(src, /Managing Director/)
  assert.match(src, /Order number/)
  assert.doesNotMatch(src, /Order code/)
  assert.match(src, /autoPrint/)
  assert.match(src, /window\.print/)
})

test('email receipt disables auto-print and attaches official HTML', () => {
  const send = read('lib/shop/send-confirmed-order-receipt.ts')
  const email = read('lib/email/shop-order-receipt.ts')
  assert.match(send, /createOrderReceiptHTML/)
  assert.match(send, /autoPrint:\s*false/)
  assert.match(send, /loadCertificateBranding/)
  assert.match(send, /isCustomerReceiptEmail/)
  assert.match(send, /not_confirmed/)
  assert.match(email, /Official order receipt —/)
  assert.match(email, /Official-receipt-/)
  assert.match(email, /contentType:\s*'text\/html'/)
})

test('cash POS confirmation emails the official receipt; MoMo waits for approval', () => {
  const checkout = read('lib/shop/commerce-checkout.ts')
  assert.match(checkout, /sendConfirmedOrderReceiptByOrderId/)
  assert.match(checkout, /shop_order_receipt/)
  assert.match(checkout, /if \(isPaidNow\)/)
  const hooks = read('lib/email/payment-hooks.ts')
  assert.match(hooks, /order_id/)
  assert.match(hooks, /sendConfirmedOrderReceiptByOrderId/)
  assert.match(hooks, /shopOrderId/)
})

test('print receipt uses stored order_number, not a UUID prefix', () => {
  const client = read('lib/shop/order-receipt-client.ts')
  assert.match(client, /order\.order_number/)
  assert.doesNotMatch(client, /id\.slice/)
})

test('customer email helper skips POS placeholder and invalid inboxes', () => {
  assert.equal(isCustomerReceiptEmail('client@example.com'), true)
  assert.equal(isCustomerReceiptEmail('  Client@Example.com  '), true)
  assert.equal(isCustomerReceiptEmail(POS_PLACEHOLDER), false)
  assert.equal(isCustomerReceiptEmail(''), false)
  assert.equal(isCustomerReceiptEmail('not-an-email'), false)
  const src = read('lib/shop/customer-receipt-email.ts')
  assert.match(src, /pos@energyandlogics\.com/)
})

test('current commerce numbers match EL-NYZ-YYYYMMDD-####', () => {
  assert.equal(UNIFIED_RE.test('EL-NYZ-20260827-0001'), true)
  assert.equal(UNIFIED_RE.test('POS-M5K8X2-AB3F'), false)
  assert.equal(UNIFIED_RE.test('EL-M5K8X2-XY9Z'), false)
  assert.equal(UNIFIED_RE.test('EL-2026-00123'), false)
  const en = read('apps/mobile/src/i18n/messages/en.ts')
  const rw = read('apps/mobile/src/i18n/messages/rw.ts')
  assert.match(en, /EL-NYZ-20260827-0001/)
  assert.match(rw, /EL-NYZ-20260827-0001/)
  assert.doesNotMatch(en, /EL-2026-00123/)
  assert.doesNotMatch(rw, /EL-2026-00123/)
})

test('package.json exposes test:shop-receipt', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(
    pkg.scripts['test:shop-receipt'],
    'node --test scripts/shop-order-receipt-selfcheck.mjs'
  )
})
