/**
 * Android customer checkout: public shop APIs, cart persist, quantity caps.
 * Run via pnpm test:mobile
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mobile = join(root, 'apps', 'mobile')

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.expo' || name === 'dist') continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

function readMobile(rel) {
  return readFileSync(join(mobile, rel), 'utf8')
}

function readRoot(rel) {
  return readFileSync(join(root, rel), 'utf8')
}

function clampCartQuantity(quantity, maxQuantity) {
  const max = Math.max(0, Math.floor(Number(maxQuantity) || 0))
  const q = Math.floor(Number(quantity) || 0)
  if (q < 1 || max < 1) return 0
  return Math.min(q, max)
}

function nextAddQuantity(current, add, maxQuantity) {
  const extra = Math.max(1, Math.floor(Number(add) || 1))
  return clampCartQuantity((Number(current) || 0) + extra, maxQuantity)
}

function applyAddProduct(lines, product, add = 1) {
  const existing = lines.find((line) => line.slug === product.slug)
  const maxQuantity = Math.max(0, Math.floor(Number(product.maxQuantity) || 0))
  if (existing) {
    const quantity = nextAddQuantity(existing.quantity, add, maxQuantity)
    if (quantity < 1) return lines.filter((line) => line.slug !== product.slug)
    return lines.map((line) =>
      line.slug === product.slug ? { ...line, quantity, maxQuantity, displayPrice: product.price } : line
    )
  }
  const quantity = clampCartQuantity(add, maxQuantity)
  if (quantity < 1) return lines
  return [...lines, { slug: product.slug, quantity, maxQuantity, displayPrice: product.price }]
}

function applySetQuantity(lines, slug, quantity) {
  const line = lines.find((item) => item.slug === slug)
  if (!line) return lines
  const next = clampCartQuantity(quantity, line.maxQuantity)
  if (next < 1) return lines.filter((item) => item.slug !== slug)
  return lines.map((item) => (item.slug === slug ? { ...item, quantity: next } : item))
}

function parsePersistedCart(raw) {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((row) => {
    if (!row || typeof row !== 'object') return []
    const quantity = clampCartQuantity(row.quantity, row.maxQuantity)
    if (!row.slug || quantity < 1) return []
    return [{ slug: row.slug, quantity, maxQuantity: row.maxQuantity }]
  })
}

function hasMoMoProof(receiptUrl, receiptNumber) {
  return Boolean(String(receiptUrl || '').trim() || String(receiptNumber || '').trim())
}

function emptyCartCannotCheckout(lineCount) {
  return lineCount < 1
}

function checkoutAttemptFingerprint(input) {
  return JSON.stringify({
    items: input.slugs.map((item) => ({ slug: item.slug, quantity: item.quantity })),
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail.trim().toLowerCase(),
    customerPhone: input.customerPhone.trim(),
    fulfillmentType: input.fulfillmentType,
    deliveryAddress: input.fulfillmentType === 'delivery' ? input.deliveryAddress.trim() : '',
  })
}

const cable = {
  slug: 'cable-5m',
  name: 'Cable',
  price: 2000,
  sellingQuantity: 5,
  sellingUnit: 'M',
  sellingUnitLabel: '5 M',
  maxQuantity: 3,
}

test('1 add product uses selling-unit quantity not converted length', () => {
  const rules = readMobile('src/features/shop/cart-rules.ts')
  assert.match(rules, /Never convert 2 × 5 M into 10/)
  const lines = applyAddProduct([], cable, 2)
  assert.equal(lines[0].quantity, 2)
  assert.equal(lines[0].quantity * cable.sellingQuantity, 10)
  const checkout = readMobile('app/customer/checkout.tsx')
  assert.match(checkout, /quantity: line\.quantity/)
  assert.doesNotMatch(checkout, /sellingQuantity \*|quantity \* line\.sellingQuantity/)
})

test('2 increase and decrease stay within stock', () => {
  let lines = applyAddProduct([], cable, 1)
  lines = applySetQuantity(lines, 'cable-5m', 2)
  assert.equal(lines[0].quantity, 2)
  lines = applySetQuantity(lines, 'cable-5m', 1)
  assert.equal(lines[0].quantity, 1)
})

test('3 quantity cannot exceed maxQuantity', () => {
  let lines = applyAddProduct([], cable, 4)
  assert.equal(lines[0].quantity, 3)
  lines = applySetQuantity(lines, 'cable-5m', 8)
  assert.equal(lines[0].quantity, 3)
  const detail = readMobile('app/customer/product/[slug].tsx')
  const cart = readMobile('app/customer/cart.tsx')
  assert.match(detail, /clampCartQuantity/)
  assert.match(cart, /canIncreaseCartQuantity/)
  assert.match(cart, /disabled=\{!canIncrease\}/)
})

test('4 cart survives restart via local file persist', () => {
  const store = readMobile('src/features/shop/cart-store.ts')
  const persist = readMobile('src/features/shop/cart-persist.ts')
  const layout = readMobile('app/_layout.tsx')
  assert.match(store, /readPersistedCartJson/)
  assert.match(store, /writePersistedCartJson/)
  assert.match(store, /parsePersistedCart/)
  assert.match(persist, /el-customer-cart\.json/)
  assert.match(persist, /expo-file-system\/legacy/)
  assert.match(layout, /hydrateCart/)
  assert.doesNotMatch(store, /receiptUrl|receiptNumber|customerPhone|momo/)
  const restored = parsePersistedCart([
    { slug: 'cable-5m', quantity: 2, maxQuantity: 3 },
    { slug: 'gone', quantity: 2, maxQuantity: 0 },
  ])
  assert.equal(restored.length, 1)
  assert.equal(restored[0].quantity, 2)
})

test('5 empty cart cannot checkout', () => {
  assert.equal(emptyCartCannotCheckout(0), true)
  assert.equal(emptyCartCannotCheckout(1), false)
  const screen = readMobile('app/customer/checkout.tsx')
  assert.match(screen, /emptyCartCannotCheckout/)
  assert.match(screen, /checkout\.emptyCart/)
  assert.doesNotMatch(screen, /createPublicOrder\(\{[\s\S]*lines\.length === 0/)
})

test('6 checkout validation matches server-required fields', () => {
  const schema = readMobile('src/features/shop/checkout-schema.ts')
  const screen = readMobile('app/customer/checkout.tsx')
  assert.match(schema, /customerName/)
  assert.match(schema, /customerEmail/)
  assert.match(schema, /customerPhone/)
  assert.match(schema, /fulfillmentType/)
  assert.match(schema, /delivery/)
  assert.match(schema, /deliveryAddress/)
  assert.match(screen, /zodResolver\(checkoutDetailsSchema\)/)
  assert.match(screen, /checkoutFieldErrorKey/)
  assert.match(readMobile('src/features/shop/checkout-error.ts'), /checkout\.error\.name/)
})

test('7 customer checkout is MoMo-only like the public web shop', () => {
  const screen = readMobile('app/customer/checkout.tsx')
  const publicApi = readMobile('src/api/public.ts')
  const api = readRoot('app/api/shop/orders/route.ts')
  assert.match(screen, /checkout\.paymentMomo/)
  assert.doesNotMatch(screen, /paymentMethod: 'cash'|checkout\.paymentCash/)
  assert.match(publicApi, /paymentMethod: 'momo'/)
  assert.match(api, /paymentMethod: 'momo'/)
})

test('8 MoMo proof is required before submit', () => {
  assert.equal(hasMoMoProof('', ''), false)
  assert.equal(hasMoMoProof('https://files.example/r.jpg', ''), true)
  assert.equal(hasMoMoProof('', '12345'), true)
  const screen = readMobile('app/customer/checkout.tsx')
  assert.match(screen, /hasMoMoProof/)
  assert.match(screen, /uploadPublicReceipt/)
  assert.match(readMobile('src/api/public.ts'), /\/api\/public\/upload-receipt/)
  assert.match(screen, /checkout\.receiptRequired/)
  assert.match(screen, /receiptReplace/)
})

test('9 successful order creation uses POST /api/shop/orders', () => {
  const publicApi = readMobile('src/api/public.ts')
  const screen = readMobile('app/customer/checkout.tsx')
  const api = readRoot('app/api/shop/orders/route.ts')
  assert.match(publicApi, /\/api\/shop\/orders/)
  assert.match(publicApi, /quotedUnitPrice/)
  assert.match(publicApi, /slug:/)
  assert.doesNotMatch(publicApi, /\/api\/mobile\/orders/)
  assert.match(screen, /createPublicOrder/)
  assert.match(screen, /clearCart/)
  assert.match(screen, /\/customer\/order\//)
  assert.match(api, /createCommerceSale/)
  assert.match(api, /resolvePublicCheckoutItems/)
  assert.doesNotMatch(api, /body\.locationId|body\.totalAmount|body\.stock/)
})

test('10 duplicate submit reuses one idempotency key', () => {
  const same = checkoutAttemptFingerprint({
    slugs: [{ slug: 'cable-5m', quantity: 2 }],
    customerName: 'Ada',
    customerEmail: 'ada@example.com',
    customerPhone: '0788',
    fulfillmentType: 'pickup',
    deliveryAddress: '',
  })
  const again = checkoutAttemptFingerprint({
    slugs: [{ slug: 'cable-5m', quantity: 2 }],
    customerName: 'Ada',
    customerEmail: 'ada@example.com',
    customerPhone: '0788',
    fulfillmentType: 'pickup',
    deliveryAddress: '',
  })
  assert.equal(same, again)
  const screen = readMobile('app/customer/checkout.tsx')
  const api = readRoot('app/api/shop/orders/route.ts')
  assert.match(screen, /newOnlineIdempotencyKey/)
  assert.match(screen, /attempt\.current/)
  assert.match(screen, /disabled=\{submitting \|\| uploading\}/)
  assert.match(api, /normalizeIdempotencyKey/)
  assert.match(api, /idempotencyKey/)
})

test('11 confirmation shows public order reference not UUID', () => {
  const confirm = readMobile('app/customer/order/[ref].tsx')
  const publicApi = readMobile('src/api/public.ts')
  assert.match(confirm, /confirm\.title/)
  assert.match(confirm, /decoded/)
  assert.match(confirm, /confirm\.paymentPending/)
  assert.doesNotMatch(confirm, /order_id|orderId/)
  assert.match(publicApi, /orderNumber/)
  assert.doesNotMatch(publicApi, /orderId/)
})

test('12 track-order navigation is public and reuses GET /api/shop/orders', () => {
  const confirm = readMobile('app/customer/order/[ref].tsx')
  const track = readMobile('app/customer/track.tsx')
  const publicApi = readMobile('src/api/public.ts')
  const get = readRoot('app/api/shop/orders/[ref]/route.ts')
  assert.match(confirm, /\/customer\/track/)
  assert.match(confirm, /confirm\.track/)
  assert.match(track, /usePublicOrder/)
  assert.match(publicApi, /\/api\/shop\/orders\/\$\{encodeURIComponent\(ref\)\}/)
  assert.match(get, /getPublicOrder/)
  assert.doesNotMatch(track, /\/login|staffRequest|payments:approve/)
})

test('13 EN/RW checkout copy is centralized', () => {
  const en = readMobile('src/i18n/messages/en.ts')
  const rw = readMobile('src/i18n/messages/rw.ts')
  const screen = readMobile('app/customer/checkout.tsx')
  assert.match(en, /'checkout\.submit': 'Submit order'/)
  assert.match(rw, /'checkout\.submit': 'Tanga icyatumijwe'/)
  assert.match(en, /'confirm\.title': 'Order placed successfully'/)
  assert.match(rw, /'confirm\.title': 'Ibyatumijwe byakiriwe neza'/)
  assert.match(screen, /useShopText/)
  assert.doesNotMatch(screen, /Submit order|Something went wrong/)
})

test('14 network failure surfaces a retryable checkout message', () => {
  const error = readMobile('src/features/shop/checkout-error.ts')
  const errors = readMobile('src/api/errors.ts')
  assert.match(error, /code === 'network'/)
  assert.match(error, /checkout\.network/)
  assert.match(errors, /Prices or availability changed/)
})

test('15 server validation failures keep the useful message', () => {
  const error = readMobile('src/features/shop/checkout-error.ts')
  const errors = readMobile('src/api/errors.ts')
  assert.match(error, /Name, email, and phone are required/)
  assert.match(error, /Delivery address is required/)
  assert.match(error, /CART_CHANGED/)
  assert.match(errors, /Name, email, and phone are required/)
  assert.match(errors, /Cart is empty/)
})

test('customer checkout never embeds secrets or staff payment review', () => {
  const sources = walk(join(mobile, 'app', 'customer'))
    .concat([
      join(mobile, 'src', 'api', 'public.ts'),
      join(mobile, 'src', 'features', 'shop', 'cart-store.ts'),
      join(mobile, 'src', 'features', 'shop', 'checkout-schema.ts'),
    ])
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  assert.doesNotMatch(sources, /SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY|supabaseAdmin/)
  assert.doesNotMatch(sources, /createCommerceSale\(|payments:approve|shop:payments_review/)
  assert.doesNotMatch(sources, /\/api\/staff\/pos\/sales/)
})
