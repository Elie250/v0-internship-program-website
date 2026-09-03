/**
 * Shop POS refund architecture self-check (Phase 1E.5-G).
 * Run: pnpm test:shop-refunds
 *
 * Source inspections + pure policy math. No live DB, no production refunds.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mobile = join(root, 'apps', 'mobile')
const read = (rel) => readFileSync(join(root, rel), 'utf8')
const readMobile = (rel) => readFileSync(join(mobile, rel), 'utf8')

const FILES = [
  'scripts/92-shop-refunds.sql',
  'lib/shop/refunds/policy.ts',
  'lib/shop/refunds/service.ts',
  'app/api/staff/orders/[id]/refunds/route.ts',
  'app/api/staff/refunds/[id]/decision/route.ts',
  'lib/shop/stock-ops.ts',
  'apps/mobile/app/staff/sales/index.tsx',
  'apps/mobile/app/staff/sales/[id].tsx',
  'apps/mobile/src/features/refunds/policy.ts',
  'apps/mobile/src/features/refunds/hooks.ts',
  'apps/mobile/src/features/refunds/confirm-refund.ts',
]

test('refund architecture files exist', () => {
  for (const rel of FILES) {
    assert.ok(existsSync(join(root, rel)), `missing ${rel}`)
  }
})

test('package.json exposes test:shop-refunds', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.scripts['test:shop-refunds'], 'node --test scripts/shop-refunds-selfcheck.mjs')
})

const policy = await import(pathToFileURL(join(root, 'lib/shop/refunds/policy.ts')).href)
const mobilePolicy = await import(pathToFileURL(join(mobile, 'src/features/refunds/policy.ts')).href)

test('authorization: salesperson cannot approve; Academy payments:approve is unused', () => {
  const perms = read('lib/admin/permissions.ts')
  const requestRoute = read('app/api/staff/orders/[id]/refunds/route.ts')
  const decideRoute = read('app/api/staff/refunds/[id]/decision/route.ts')
  const staffPerms = read('lib/shop/staff-api/permissions.ts')
  const aliases = perms.slice(
    perms.indexOf('export function expandShopPermissionAliases'),
    perms.indexOf('export function getRoleDefinition')
  )
  const salesperson = perms.slice(
    perms.indexOf('salesperson: ['),
    perms.indexOf('inventory_manager: [')
  )
  const inventory = perms.slice(
    perms.indexOf('inventory_manager: ['),
    perms.indexOf('}', perms.indexOf('inventory_manager: ['))
  )

  assert.match(perms, /SHOP_REFUNDS_REQUEST: 'shop:refunds_request'/)
  assert.match(perms, /SHOP_REFUNDS_APPROVE: 'shop:refunds_approve'/)
  assert.match(salesperson, /SHOP_REFUNDS_REQUEST/)
  assert.doesNotMatch(salesperson, /SHOP_REFUNDS_APPROVE/)
  assert.doesNotMatch(salesperson, /PAYMENTS_APPROVE/)
  assert.match(inventory, /SHOP_REFUNDS_REQUEST/)
  assert.doesNotMatch(inventory, /SHOP_REFUNDS_APPROVE/)
  assert.doesNotMatch(inventory, /PAYMENTS_APPROVE/)
  assert.doesNotMatch(aliases, /SHOP_REFUNDS_APPROVE|SHOP_REFUNDS_REQUEST|payments:approve/)

  assert.match(staffPerms, /refundsRequest: PERMISSIONS\.SHOP_REFUNDS_REQUEST/)
  assert.match(staffPerms, /refundsApprove: PERMISSIONS\.SHOP_REFUNDS_APPROVE/)
  assert.match(requestRoute, /STAFF_API_PERMISSIONS\.refundsRequest/)
  assert.match(decideRoute, /STAFF_API_PERMISSIONS\.refundsApprove/)
  assert.doesNotMatch(requestRoute, /PAYMENTS_APPROVE|payments:approve|payments\/review/)
  assert.doesNotMatch(decideRoute, /PAYMENTS_APPROVE|payments:approve|payments\/review/)
  assert.match(requestRoute, /requireStaffPermission/)
  assert.match(decideRoute, /requireStaffPermission/)
  assert.match(read('lib/staff/context.ts'), /status: 401/)
  assert.match(read('lib/staff/context.ts'), /status: 403/)
})

test('admin remains authorized for request and approve via ALL_PERMISSIONS', () => {
  const perms = read('lib/admin/permissions.ts')
  assert.match(perms, /if \(role === 'admin'\) return ALL_PERMISSIONS/)
  assert.match(perms, /SHOP_REFUNDS_APPROVE/)
  assert.match(perms, /SHOP_REFUNDS_REQUEST/)
})

test('refund routes are CSRF-gated staff APIs, not Academy payment review', () => {
  const requestRoute = read('app/api/staff/orders/[id]/refunds/route.ts')
  const decideRoute = read('app/api/staff/refunds/[id]/decision/route.ts')
  assert.match(requestRoute, /assertStaffMutationAllowed/)
  assert.match(decideRoute, /assertStaffMutationAllowed/)
  assert.doesNotMatch(requestRoute, /\/api\/admin\/payments\/review/)
  assert.doesNotMatch(decideRoute, /reviewPaymentCore/)
  assert.doesNotMatch(read('lib/shop/refunds/service.ts'), /refund-payment|payments:approve/)
})

test('financial integrity: original sale is never rewritten', () => {
  const service = read('lib/shop/refunds/service.ts')
  assert.doesNotMatch(service, /from\('orders'\)[\s\S]{0,120}\.(update|delete)\(/)
  assert.doesNotMatch(service, /from\('order_items'\)[\s\S]{0,120}\.(update|delete)\(/)
  assert.doesNotMatch(service, /from\('payments'\)/)
  assert.match(service, /from\('shop_refunds'\)/)
  assert.match(service, /from\('shop_refund_lines'\)/)
  assert.match(service, /original\.unit_price/)
  assert.match(service, /FORBIDDEN_CLIENT_FIELDS/)
  assert.match(service, /'amount'/)
  assert.match(service, /'unitPrice'/)
  assert.match(service, /'stock'/)
  assert.match(service, /'userId'/)
  assert.match(service, /'paymentMethod'/)
  assert.match(service, /Refund amount and stock are calculated by the server/)
})

test('policy math: partial, full, over-refund, and original price', async () => {
  assert.equal(policy.refundableQuantity(2, 0), 2)
  assert.equal(policy.refundableQuantity(2, 1), 1)
  assert.equal(policy.refundableQuantity(2, 2), 0)
  assert.equal(policy.refundableQuantity(2, 3), 0)
  assert.equal(policy.refundLineAmount(13000, 1), 13000)
  assert.equal(policy.refundLineAmount(13000, 2), 26000)
  assert.equal(policy.refundLineAmount(13000, 0), 0)
  assert.equal(policy.refundLineAmount(99999, 0), 0)
  assert.equal(
    policy.aggregateRefundStatus({
      soldQuantity: 2,
      approvedQuantity: 1,
      requestedQuantity: 0,
      hasRejected: false,
    }),
    'partial'
  )
  assert.equal(
    policy.aggregateRefundStatus({
      soldQuantity: 2,
      approvedQuantity: 2,
      requestedQuantity: 0,
      hasRejected: false,
    }),
    'full'
  )
  assert.equal(
    policy.aggregateRefundStatus({
      soldQuantity: 2,
      approvedQuantity: 0,
      requestedQuantity: 1,
      hasRejected: false,
    }),
    'requested'
  )
  assert.equal(
    policy.aggregateRefundStatus({
      soldQuantity: 2,
      approvedQuantity: 0,
      requestedQuantity: 0,
      hasRejected: true,
    }),
    'rejected'
  )
  assert.equal(policy.refundStatusLabel('none'), 'No refund')
  assert.equal(policy.refundStatusLabel('requested'), 'Refund requested')
  assert.equal(policy.refundStatusLabel('partial'), 'Partially refunded')
  assert.equal(policy.refundStatusLabel('full'), 'Fully refunded')
  assert.equal(policy.refundStatusLabel('rejected'), 'Refund rejected')

  const originalUnit = 13000
  const currentCatalogPrice = 15000
  assert.equal(policy.refundLineAmount(originalUnit, 1), 13000)
  assert.notEqual(policy.refundLineAmount(originalUnit, 1), currentCatalogPrice)

  const remaining = policy.refundableQuantity(2, 1)
  assert.equal(1 > remaining, false)
  assert.equal(2 > remaining, true)
})

test('eligibility blocks online orders, unpaid sales, and cancelled sales', () => {
  assert.equal(
    policy.isPosRefundEligibleOrder({
      channel: 'pos',
      paymentStatus: 'paid',
      stockState: 'consumed',
      status: 'completed',
    }),
    true
  )
  assert.equal(
    policy.isPosRefundEligibleOrder({
      channel: 'online',
      paymentStatus: 'paid',
      stockState: 'consumed',
      status: 'completed',
    }),
    false
  )
  assert.equal(
    policy.isPosRefundEligibleOrder({
      channel: 'pos',
      paymentStatus: 'pending_review',
      stockState: 'reserved',
      status: 'pending',
    }),
    false
  )
  assert.equal(
    policy.isPosRefundEligibleOrder({
      channel: 'pos',
      paymentStatus: 'paid',
      stockState: 'consumed',
      status: 'cancelled',
    }),
    false
  )
  const service = read('lib/shop/refunds/service.ts')
  assert.match(service, /Online orders cannot be refunded here/)
  assert.match(service, /Refund quantity is not available/)
  assert.match(service, /This sale is already fully refunded/)
  assert.match(service, /Refund line does not belong to this sale/)
})

test('idempotency scopes and fingerprints change when lines or quantity change', () => {
  const service = read('lib/shop/refunds/service.ts')
  assert.match(service, /scope = 'shop_refund_request'/)
  assert.match(service, /shop_refund_decision:\$\{input\.refundId\}/)
  assert.match(service, /shop_refund_decision_lock:\$\{input\.refundId\}/)
  assert.match(service, /beginIdempotentRequest/)
  const a = policy.refundRequestFingerprint({
    orderId: 'o1',
    items: [{ orderItemId: 'i1', quantity: 1 }],
    reason: 'customer_return',
  })
  const b = policy.refundRequestFingerprint({
    orderId: 'o1',
    items: [{ orderItemId: 'i1', quantity: 2 }],
    reason: 'customer_return',
  })
  assert.notDeepEqual(a, b)
})

test('stock restore uses RETURN, is retry-safe, and rolls back a failed commit', () => {
  const stock = read('lib/shop/stock-ops.ts')
  const service = read('lib/shop/refunds/service.ts')
  assert.match(stock, /restoreStockForReturn/)
  assert.match(stock, /rollbackRestoredReturn/)
  assert.match(stock, /movementType: 'RETURN'/)
  assert.match(stock, /returnAlreadyRecorded/)
  assert.match(stock, /shop_release_stock|releaseStockAtomic/)
  assert.match(service, /restoreStockForReturn/)
  assert.match(service, /rollbackRestoredReturn/)
  assert.match(service, /if \(restored\)/)
  assert.match(service, /stock\.error/)
})

test('schema keeps original sales immutable and grants narrow permissions', () => {
  const sql = read('scripts/92-shop-refunds.sql')
  assert.match(sql, /CREATE TABLE IF NOT EXISTS shop_refunds/)
  assert.match(sql, /CREATE TABLE IF NOT EXISTS shop_refund_lines/)
  assert.match(sql, /REFERENCES orders\(id\) ON DELETE RESTRICT/)
  assert.match(sql, /REFERENCES order_items\(id\) ON DELETE RESTRICT/)
  assert.match(sql, /CHECK \(quantity > 0\)/)
  assert.match(sql, /shop:refunds_request/)
  assert.match(sql, /shop:refunds_approve/)
  assert.match(sql, /r\.slug = 'admin'/)
  assert.match(sql, /salesperson/)
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/)
  assert.doesNotMatch(sql, /payments:approve/)
  assert.doesNotMatch(sql, /CREATE POLICY/)
  assert.doesNotMatch(sql, /UPDATE orders|DELETE FROM orders|UPDATE order_items/)
})

test('reporting keeps gross sales and records refunds separately', () => {
  const dashboard = read('lib/shop/staff-api/dashboard.ts')
  const view = read('components/shop-portal/shop-dashboard.tsx')
  assert.match(dashboard, /if \(paid\) todaySales \+= Number\(order\.total_amount/)
  assert.match(dashboard, /todayRefunds/)
  assert.match(dashboard, /todayNetSales: Math\.max\(0, todaySales - todayRefunds\)/)
  assert.doesNotMatch(dashboard, /todaySales\s*-=/)
  assert.doesNotMatch(view, /todaySales\s*-\s*/)
})

test('receipt schema is unchanged by refunds', () => {
  const receipt = read('lib/shop/receipt-model.ts')
  const service = read('lib/shop/refunds/service.ts')
  assert.match(receipt, /schemaVersion: 1/)
  assert.doesNotMatch(service, /buildReceiptModel|receipt-model/)
})

test('mobile refunds start from Sales, not POS checkout', () => {
  const pos = readMobile('app/staff/pos.tsx')
  const sales = readMobile('app/staff/sales/index.tsx')
  const detail = readMobile('app/staff/sales/[id].tsx')
  const confirm = readMobile('src/features/refunds/confirm-refund.ts')
  const hooks = readMobile('src/features/refunds/hooks.ts')
  const api = readMobile('src/api/staff.ts')
  const refundRequestFn = api.slice(api.indexOf('export async function requestShopRefund'))
  const refundDecideFn = api.slice(api.indexOf('export async function decideShopRefund'))
  const permissions = readMobile('src/permissions.ts')

  assert.doesNotMatch(pos, /label="Refund"|Refund requested|Confirm refund/)
  assert.match(pos, /Confirm sale/)
  assert.match(sales, /\/staff\/sales\/\$\{row\.id\}/)
  assert.match(sales, /refundStatusLabel/)
  assert.match(detail, /label="Refund"/)
  assert.match(detail, /canRequestShopRefund/)
  assert.match(detail, /canApproveShopRefund/)
  assert.match(detail, /isPosRefundEligible/)
  assert.match(detail, /Math\.min\(max,/)
  assert.match(detail, /confirmShopRefund/)
  assert.match(detail, /pending/)
  assert.match(confirm, /cancelLabel: 'Cancel'/)
  assert.match(confirm, /Confirm refund/)
  assert.match(hooks, /inflightRefund/)
  assert.match(refundRequestFn, /\/api\/staff\/orders\/\$\{input\.orderId\}\/refunds/)
  assert.match(refundDecideFn, /\/api\/staff\/refunds\/\$\{input\.refundId\}\/decision/)
  assert.doesNotMatch(refundRequestFn.slice(0, 800), /unitPrice|productPrice|paymentStatus/)
  assert.doesNotMatch(refundDecideFn.slice(0, 700), /amount:|unitPrice:|stock:/)
  assert.match(permissions, /SHOP_REFUNDS_REQUEST/)
  assert.match(permissions, /SHOP_REFUNDS_APPROVE/)
  assert.doesNotMatch(permissions, /payments:approve/)
  assert.equal(mobilePolicy.refundStatusLabel('full'), 'Fully refunded')
  assert.equal(
    mobilePolicy.isPosRefundEligible({
      channel: 'pos',
      paymentStatus: 'paid',
      stockState: 'consumed',
      refundStatus: 'full',
    }),
    false
  )
})
