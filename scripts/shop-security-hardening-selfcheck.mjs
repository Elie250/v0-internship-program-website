/**
 * Phase 1C security hardening regression tests.
 * Run: pnpm test:shop-security
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function canViewStaffProductCost(permissions) {
  return Array.isArray(permissions) && permissions.includes('shop:products')
}

function stripProductCostFields(item) {
  const { costPrice, ...rest } = item
  return rest
}

function stripOrderLineCostFields(item) {
  const { unitCost, ...rest } = item
  return rest
}

const BUSINESS_PATTERNS = [
  {
    test: /insufficient.?stock|available:\s*\d+/i,
    error: 'Insufficient stock',
    httpStatus: 409,
  },
  {
    test: /cart is empty|invalid cart|invalid cart item|invalid product/i,
    error: 'Invalid cart',
    httpStatus: 400,
  },
]

const LOOKS_LIKE_DB =
  /relation |column |constraint |violates |duplicate key|PGRST|postgres|supabase|syntax error|permission denied for|foreign key|null value in column|could not find/i

function toSafeCommerceClientError(raw, fallbackStatus = 500) {
  const message = String(raw ?? '').trim()
  if (!message) {
    return { error: 'Sale could not be completed.', httpStatus: fallbackStatus }
  }
  for (const rule of BUSINESS_PATTERNS) {
    if (rule.test.test(message)) {
      return { error: rule.error, httpStatus: rule.httpStatus }
    }
  }
  if (LOOKS_LIKE_DB.test(message) || message.length > 180) {
    return { error: 'Sale could not be completed.', httpStatus: 500 }
  }
  if (fallbackStatus >= 500) {
    return { error: 'Sale could not be completed.', httpStatus: 500 }
  }
  return { error: message, httpStatus: fallbackStatus }
}

function isBcryptPasswordHash(stored) {
  if (!stored) return false
  return (
    stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')
  )
}

/** Mirror of lib/staff/login-rate-limit.ts for isolated tests. */
const STAFF_LOGIN_EMAIL_MAX_ATTEMPTS = 8
const STAFF_LOGIN_WINDOW_MS = 15 * 60 * 1000
const emailBuckets = new Map()
const ipBuckets = new Map()

function hashStaffLoginIp(ip) {
  return createHash('sha256').update(ip.trim() || 'unknown').digest('hex')
}

function touchBucket(map, key, max, now) {
  const existing = map.get(key)
  if (!existing || now - existing.windowStartedAt >= STAFF_LOGIN_WINDOW_MS) {
    map.set(key, { count: 1, windowStartedAt: now })
    return { allowed: true, retryAfterSec: 0 }
  }
  if (existing.count >= max) {
    return {
      allowed: false,
      retryAfterSec: Math.max(
        1,
        Math.ceil((STAFF_LOGIN_WINDOW_MS - (now - existing.windowStartedAt)) / 1000)
      ),
    }
  }
  existing.count += 1
  return { allowed: true, retryAfterSec: 0 }
}

function checkStaffLoginRateLimit({ email, clientIp, now = Date.now() }) {
  const emailRes = touchBucket(
    emailBuckets,
    email.trim().toLowerCase() || 'unknown',
    STAFF_LOGIN_EMAIL_MAX_ATTEMPTS,
    now
  )
  if (!emailRes.allowed) {
    return { allowed: false, reason: 'email', retryAfterSec: emailRes.retryAfterSec }
  }
  const ipRes = touchBucket(ipBuckets, hashStaffLoginIp(clientIp), 40, now)
  if (!ipRes.allowed) {
    return { allowed: false, reason: 'ip', retryAfterSec: ipRes.retryAfterSec }
  }
  return { allowed: true }
}

function resetStaffLoginRateLimitForTests() {
  emailBuckets.clear()
  ipBuckets.clear()
}

test('cost policy: products_view alone cannot see cost', () => {
  assert.equal(canViewStaffProductCost(['shop:products_view', 'shop:pos_sell']), false)
  assert.equal(canViewStaffProductCost(['shop:products']), true)
})

test('cost stripping removes costPrice / unitCost from payloads', () => {
  assert.deepEqual(stripProductCostFields({ id: '1', costPrice: 99, name: 'A' }), {
    id: '1',
    name: 'A',
  })
  assert.deepEqual(stripOrderLineCostFields({ id: '1', unitCost: 5, unitPrice: 10 }), {
    id: '1',
    unitPrice: 10,
  })
})

test('product and order API routes gate includeCost by permission', () => {
  for (const rel of [
    'app/api/staff/products/route.ts',
    'app/api/staff/products/[id]/route.ts',
    'app/api/staff/orders/[id]/route.ts',
  ]) {
    const src = readFileSync(join(root, rel), 'utf8')
    assert.match(src, /canViewStaffProductCost/)
    assert.match(src, /includeCost/)
  }
})

test('products service omits costPrice unless includeCost', () => {
  const src = readFileSync(join(root, 'lib/shop/staff-api/products.ts'), 'utf8')
  assert.match(src, /if \(includeCost\)/)
  assert.match(src, /mapped\.costPrice/)
})

test('order detail omits unitCost unless includeCost', () => {
  const src = readFileSync(join(root, 'lib/shop/staff-api/orders.ts'), 'utf8')
  assert.match(src, /includeCost \? \{ unitCost/)
})

test('query-parameter tricks cannot force cost into product list route', () => {
  const list = readFileSync(join(root, 'app/api/staff/products/route.ts'), 'utf8')
  assert.doesNotMatch(list, /includeCost.*searchParams|searchParams.*includeCost|body\.includeCost/)
})

test('DB/SQL errors are sanitized for clients', () => {
  const dup = toSafeCommerceClientError(
    'duplicate key value violates unique constraint "orders_pkey"',
    500
  )
  assert.equal(dup.error, 'Sale could not be completed.')
  assert.doesNotMatch(dup.error, /duplicate|constraint|orders_pkey/i)

  const stock = toSafeCommerceClientError('Insufficient stock for Cable. Available: 0', 409)
  assert.equal(stock.error, 'Insufficient stock')
  assert.equal(stock.httpStatus, 409)
})

test('createCommerceSale fail path uses toSafeCommerceClientError', () => {
  const src = readFileSync(join(root, 'lib/shop/commerce-checkout.ts'), 'utf8')
  assert.match(src, /toSafeCommerceClientError/)
})

test('POS sales resolve NYANZA server-side and ignore client location', () => {
  const src = readFileSync(join(root, 'app/api/staff/pos/sales/route.ts'), 'utf8')
  assert.match(src, /resolveShopPortalPosLocation/)
  assert.match(src, /locationId: portalLocation\?\.id/)
  assert.doesNotMatch(src, /body\.location_id|body\.locationId/)
  assert.match(src, /Never trust client-supplied location/)
})

test('public shop orders resolve NYANZA server-side and omit order UUID', () => {
  const src = readFileSync(join(root, 'app/api/shop/orders/route.ts'), 'utf8')
  assert.match(src, /resolveShopPortalPosLocation/)
  assert.match(src, /locationId: portalLocation\?\.id/)
  assert.match(src, /createCommerceSale/)
  assert.match(src, /resolvePublicCheckoutItems/)
  assert.doesNotMatch(src, /body\.location_id|body\.locationId/)
  assert.doesNotMatch(src, /orderId: result\.orderId/)
  assert.doesNotMatch(src, /cost_price|costPrice|unitCost/)
})

test('location resolver uses SHOP_LOCATION_CODES.NYANZA not a hard-coded UUID', () => {
  const src = readFileSync(join(root, 'lib/shop/resolve-pos-location.ts'), 'utf8')
  assert.match(src, /SHOP_LOCATION_CODES\.NYANZA/)
  assert.doesNotMatch(
    src,
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  )
})

test('commerce insert supports server location_id', () => {
  const src = readFileSync(join(root, 'lib/shop/commerce-checkout.ts'), 'utf8')
  assert.match(src, /location_id: input\.locationId/)
})

test('plaintext password authentication is rejected', () => {
  assert.equal(isBcryptPasswordHash('secret-plaintext'), false)
  assert.equal(isBcryptPasswordHash('$2a$10$abcdefghijklmnopqrstuu'), true)
  const src = readFileSync(join(root, 'lib/staff/auth.ts'), 'utf8')
  assert.doesNotMatch(src, /password === stored/)
  assert.match(src, /not bcrypt|Only bcrypt/)
})

test('staff login rate limit blocks repeated attempts', () => {
  resetStaffLoginRateLimitForTests()
  const email = 'brute@example.com'
  const clientIp = '203.0.113.9'
  let blocked = false
  for (let i = 0; i < STAFF_LOGIN_EMAIL_MAX_ATTEMPTS + 2; i++) {
    const result = checkStaffLoginRateLimit({ email, clientIp })
    if (!result.allowed) {
      blocked = true
      assert.equal(result.reason, 'email')
      assert.ok((result.retryAfterSec ?? 0) >= 1)
      break
    }
  }
  assert.equal(blocked, true)
  resetStaffLoginRateLimitForTests()
})

test('auth route enforces login rate limit', () => {
  const src = readFileSync(join(root, 'app/api/staff/auth/route.ts'), 'utf8')
  assert.match(src, /checkStaffLoginRateLimit/)
  assert.match(src, /status: 429/)
  assert.match(src, /Retry-After/)
})

test('rate-limit constants match implementation file', () => {
  const src = readFileSync(join(root, 'lib/staff/login-rate-limit.ts'), 'utf8')
  assert.match(src, /STAFF_LOGIN_EMAIL_MAX_ATTEMPTS = 8/)
  assert.match(src, /multi-instance|serverless/i)
})

test('migrations 86-88 were not modified by hardening', () => {
  for (const rel of [
    'scripts/86-commerce-pos-foundation.sql',
    'scripts/87-shop-locations-foundation.sql',
    'scripts/88-shop-products-view-permission.sql',
  ]) {
    assert.ok(existsSync(join(root, rel)))
  }
})

test('package.json exposes test:shop-security', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  assert.equal(
    pkg.scripts['test:shop-security'],
    'node --test scripts/shop-security-hardening-selfcheck.mjs'
  )
})
