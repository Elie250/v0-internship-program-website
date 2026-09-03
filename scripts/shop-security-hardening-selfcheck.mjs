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
  return Array.isArray(permissions) && permissions.includes('shop:cost_price')
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
  assert.equal(canViewStaffProductCost(['shop:products']), false)
  assert.equal(canViewStaffProductCost(['shop:cost_price']), true)
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

test('staff product PATCH is CSRF-gated and splits product, cost, and selling-price writes', () => {
  const route = readFileSync(join(root, 'app/api/staff/products/[id]/route.ts'), 'utf8')
  assert.match(route, /export async function PATCH/)
  assert.match(route, /assertStaffMutationAllowed/)
  assert.match(route, /PERMISSIONS\.SHOP_PRODUCTS/)
  assert.match(route, /PERMISSIONS\.SHOP_COST_PRICE/)
  assert.match(route, /PERMISSIONS\.SHOP_SELLING_PRICE/)
  assert.match(route, /parseSellingUnitPatch/)
  assert.match(route, /parseStorefrontFeaturedFlag/)
  assert.match(route, /updateStaffProduct/)
  const svc = readFileSync(join(root, 'lib/shop/staff-api/products.ts'), 'utf8')
  const updateStart = svc.indexOf('export async function updateStaffProduct(')
  const updateFn = svc.slice(updateStart, svc.indexOf('export async function archiveStaffProduct'))
  assert.match(updateFn, /canManageProduct/)
  assert.match(updateFn, /canSetCost/)
  assert.match(updateFn, /canSetSelling/)
  assert.match(updateFn, /if \(!options\.canSetCost\) return \{ error: 'Forbidden'/)
  assert.match(updateFn, /if \(!options\.canSetSelling\) return \{ error: 'Forbidden'/)
  assert.doesNotMatch(updateFn, /stock:/)
  const adminPost = readFileSync(join(root, 'app/api/products/route.ts'), 'utf8')
  assert.match(adminPost, /applySellingUnitToProductPayload/)
  assert.match(adminPost, /applyStorefrontFeaturedToProductPayload/)
  assert.match(adminPost, /applyBarcodeToProductPayload/)
  assert.match(adminPost, /DUPLICATE_BARCODE_MESSAGE/)
  const adminPatch = readFileSync(join(root, 'app/api/products/[id]/route.ts'), 'utf8')
  assert.match(adminPatch, /applySellingUnitToProductPayload/)
  assert.match(adminPatch, /applyStorefrontFeaturedToProductPayload/)
  assert.match(adminPatch, /applyBarcodeToProductPayload/)
  assert.match(adminPatch, /DUPLICATE_BARCODE_MESSAGE/)
  const helper = readFileSync(join(root, 'lib/shop/selling-unit.ts'), 'utf8')
  assert.match(helper, /Invalid selling quantity or unit/)
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

test('public merchandising reuses catalogue DTOs without cost, UUIDs, or schema flags', () => {
  const src = readFileSync(join(root, 'lib/shop/public-merchandising.ts'), 'utf8')
  assert.match(src, /PublicCatalogueItem/)
  assert.match(src, /PublicCatalogueCategory/)
  assert.doesNotMatch(src, /costPrice|cost_price|unitCost|unit_cost/)
  assert.doesNotMatch(src, /is_featured|category_id|staff/)
  assert.doesNotMatch(src, /is_trending|display_priority/)
  assert.match(src, /item\.featured/)
  assert.doesNotMatch(src, /supabaseAdmin|SERVICE_ROLE|createCommerceSale/)
  const dto = readFileSync(join(root, 'lib/shop/public-catalogue.ts'), 'utf8')
  const typeStart = dto.indexOf('export type PublicCatalogueItem')
  const typeEnd = dto.indexOf('const UUID_RE')
  const typeBlock = dto.slice(typeStart, typeEnd)
  assert.doesNotMatch(typeBlock, /\nid:/)
  assert.doesNotMatch(typeBlock, /costPrice|cost_price/)
  assert.match(typeBlock, /featured: boolean/)
  assert.doesNotMatch(typeBlock, /is_featured/)
})

test('public order tracking looks up by order_number and omits UUIDs', () => {
  const lookup = readFileSync(join(root, 'lib/shop/order-lookup.ts'), 'utf8')
  assert.match(lookup, /\.eq\('order_number', orderNumber\)/)
  assert.doesNotMatch(lookup, /cost_price|unit_cost|created_by/)
  const pub = readFileSync(join(root, 'lib/shop/public-order.ts'), 'utf8')
  assert.match(pub, /lookupOrder/)
  assert.match(pub, /toPublicOrderView/)
  const view = readFileSync(join(root, 'lib/shop/public-order-view.ts'), 'utf8')
  assert.doesNotMatch(view, /orderId|costPrice|unitCost|stockState/)
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

test('staff payment review is shop-order only, CSRF-gated, and reuses reviewPaymentCore', () => {
  const route = readFileSync(join(root, 'app/api/staff/payments/review/route.ts'), 'utf8')
  assert.match(route, /assertStaffMutationAllowed/)
  assert.match(route, /requireStaffPermission/)
  assert.match(route, /STAFF_API_PERMISSIONS\.paymentReview/)
  assert.match(route, /reviewStaffShopOrderPayment/)
  assert.doesNotMatch(route, /payments:approve|PAYMENTS_APPROVE/)
  assert.doesNotMatch(route, /createCommerceSale/)

  const helper = readFileSync(join(root, 'lib/shop/staff-api/payment-review.ts'), 'utf8')
  assert.match(helper, /reviewPaymentCore/)
  assert.match(helper, /isShopCommercePayment/)
  assert.match(helper, /This payment is not a shop order/)
  assert.doesNotMatch(helper, /createCommerceSale/)

  const core = readFileSync(join(root, 'lib/admin/review-payment-core.ts'), 'utf8')
  assert.match(core, /SHOP_PAYMENTS_REVIEW/)
  assert.match(core, /finalizeCommercePaymentApproval/)
  assert.match(core, /finalizeCommercePaymentRejection/)
})

test('shop:payments_review can review shop orders but not Academy, Library, or Support', () => {
  function hasPermission(permissions, required) {
    if (!permissions?.length) return false
    const list = Array.isArray(required) ? required : [required]
    return list.some((p) => permissions.includes(p))
  }
  function isShopCommercePayment(payment) {
    return Boolean(
      payment.order_id &&
        !payment.course_enrollment_id &&
        !payment.support_subscription_id &&
        !payment.library_purchase_id &&
        !payment.application_id
    )
  }
  function canReviewPayment(permissions, payment) {
    if (payment.course_enrollment_id) {
      return hasPermission(permissions, [
        'payments:approve',
        'applications:approve',
        'learning:students',
      ])
    }
    if (payment.library_purchase_id) {
      return hasPermission(permissions, [
        'payments:approve',
        'applications:approve',
        'content:announcements',
      ])
    }
    if (payment.support_subscription_id) {
      return hasPermission(permissions, ['payments:approve', 'support:tickets'])
    }
    if (isShopCommercePayment(payment)) {
      return hasPermission(permissions, [
        'payments:approve',
        'shop:orders',
        'shop:payments_review',
      ])
    }
    return hasPermission(permissions, 'payments:approve')
  }

  const salesperson = [
    'shop:pos_sell',
    'shop:products_view',
    'shop:sales_view',
    'shop:stock_view',
    'shop:orders_view',
  ]
  const salespersonWithReview = [...salesperson, 'shop:payments_review']
  const inventory = [
    'shop:products',
    'shop:products_view',
    'shop:stock_view',
    'shop:stock_adjust',
    'shop:orders_view',
    'shop:sales_view',
  ]
  const inventoryWithReview = [...inventory, 'shop:payments_review']
  const admin = ['payments:approve', 'shop:orders', 'shop:payments_review']

  const shopPayment = { order_id: 'o1', course_enrollment_id: null, support_subscription_id: null, library_purchase_id: null, application_id: null }
  const academy = { order_id: null, course_enrollment_id: 'e1', support_subscription_id: null, library_purchase_id: null, application_id: null }
  const library = { order_id: null, course_enrollment_id: null, support_subscription_id: null, library_purchase_id: 'l1', application_id: null }
  const support = { order_id: null, course_enrollment_id: null, support_subscription_id: 's1', library_purchase_id: null, application_id: null }

  assert.equal(canReviewPayment(salesperson, shopPayment), false)
  assert.equal(canReviewPayment(salespersonWithReview, shopPayment), true)
  assert.equal(canReviewPayment(inventory, shopPayment), false)
  assert.equal(canReviewPayment(inventoryWithReview, shopPayment), true)
  assert.equal(canReviewPayment(admin, shopPayment), true)

  assert.equal(canReviewPayment(salespersonWithReview, academy), false)
  assert.equal(canReviewPayment(salespersonWithReview, library), false)
  assert.equal(canReviewPayment(salespersonWithReview, support), false)
  assert.equal(canReviewPayment(inventoryWithReview, academy), false)
  assert.equal(canReviewPayment(admin, academy), true)
})

test('staff fulfillment PATCH cannot change payment, price, or stock', () => {
  const route = readFileSync(join(root, 'app/api/staff/orders/[id]/route.ts'), 'utf8')
  assert.match(route, /export async function PATCH/)
  assert.match(route, /assertStaffMutationAllowed/)
  assert.match(route, /STAFF_API_PERMISSIONS\.fulfillment/)
  const svc = readFileSync(join(root, 'lib/shop/staff-api/orders.ts'), 'utf8')
  assert.match(svc, /Fulfillment cannot change payment, price, or stock/)
  assert.match(svc, /Payment must be approved before fulfillment/)
  assert.doesNotMatch(svc, /createCommerceSale/)
})

test('admin permission editor includes shop staff without granting admin console', () => {
  const roles = readFileSync(join(root, 'lib/admin/data/roles.ts'), 'utf8')
  assert.match(roles, /isPermissionOverrideEligibleRole/)
  const actions = readFileSync(join(root, 'app/actions/admin-roles.ts'), 'utf8')
  assert.match(actions, /filterAssignableCustomPermissions/)
  const ui = readFileSync(join(root, 'components/admin/roles-permissions.tsx'), 'utf8')
  assert.match(ui, /Shop staff/)
  assert.doesNotMatch(ui, /No staff accounts with admin access found/)
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
