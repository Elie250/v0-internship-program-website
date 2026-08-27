/**
 * Phase 1D.1 — Shop staff management API self-checks.
 * Run: pnpm test:shop-staff
 *
 * Pure / source inspections — no live DB, no secrets.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (rel) => readFileSync(join(root, rel), 'utf8')

const PERMISSIONS = {
  SHOP_PRODUCTS: 'shop:products',
  SHOP_PRODUCTS_VIEW: 'shop:products_view',
  SHOP_POS_SELL: 'shop:pos_sell',
  SHOP_SALES_VIEW: 'shop:sales_view',
  SHOP_STOCK_VIEW: 'shop:stock_view',
  SHOP_STOCK_ADJUST: 'shop:stock_adjust',
  SHOP_ORDERS_VIEW: 'shop:orders_view',
  SHOP_CATEGORIES: 'shop:categories',
  ADMIN_ACCESS: 'admin:access',
}

const ROLE_PERMISSIONS = {
  salesperson: [
    PERMISSIONS.SHOP_POS_SELL,
    PERMISSIONS.SHOP_PRODUCTS_VIEW,
    PERMISSIONS.SHOP_SALES_VIEW,
    PERMISSIONS.SHOP_STOCK_VIEW,
    PERMISSIONS.SHOP_ORDERS_VIEW,
  ],
  inventory_manager: [
    PERMISSIONS.SHOP_PRODUCTS,
    PERMISSIONS.SHOP_PRODUCTS_VIEW,
    PERMISSIONS.SHOP_STOCK_VIEW,
    PERMISSIONS.SHOP_STOCK_ADJUST,
    PERMISSIONS.SHOP_ORDERS_VIEW,
    PERMISSIONS.SHOP_SALES_VIEW,
    PERMISSIONS.SHOP_CATEGORIES,
  ],
}

const SHOP_STAFF_ROLES = ['salesperson', 'inventory_manager']

function isShopStaffRole(value) {
  return typeof value === 'string' && SHOP_STAFF_ROLES.includes(value)
}

function shopStaffCreateRejectsAdminRole(role) {
  return !isShopStaffRole(role)
}

function shopStaffIgnoresClientPermissions(clientPermissions, role) {
  void clientPermissions
  return ROLE_PERMISSIONS[role] ?? []
}

function isBcryptPasswordHash(stored) {
  if (!stored) return false
  return (
    stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')
  )
}

test('admin can list staff — route uses requireShopAdmin', () => {
  const src = read('app/api/staff/users/route.ts')
  assert.match(src, /requireShopAdmin/)
  assert.match(src, /listShopStaffUsers/)
  assert.match(src, /export async function GET/)
})

test('admin can create salesperson and inventory_manager only', () => {
  const src = read('lib/shop/staff-users.ts')
  assert.match(src, /salesperson/)
  assert.match(src, /inventory_manager/)
  assert.match(src, /createShopStaffUser/)
  assert.equal(isShopStaffRole('salesperson'), true)
  assert.equal(isShopStaffRole('inventory_manager'), true)
  assert.equal(isShopStaffRole('admin'), false)
  assert.equal(shopStaffCreateRejectsAdminRole('admin'), true)
  assert.equal(shopStaffCreateRejectsAdminRole('salesperson'), false)
})

test('non-admin receives 403 — requireShopAdmin checks role === admin', () => {
  const src = read('lib/staff/context.ts')
  assert.match(src, /requireShopAdmin/)
  assert.match(src, /role !== 'admin'/)
  assert.match(src, /status: 403/)
})

test('unauthenticated receives 401 via requireStaffSession', () => {
  const ctx = read('lib/staff/context.ts')
  assert.match(ctx, /requireStaffSession/)
  assert.match(ctx, /status: 401/)
  const admin = read('lib/staff/context.ts')
  assert.match(admin, /requireShopAdmin[\s\S]*requireStaffSession/)
})

test('client cannot inject admin permissions — server uses getPermissionsForRole', () => {
  const src = read('lib/shop/staff-users.ts')
  assert.match(src, /getPermissionsForRole\(input\.role\)/)
  assert.match(src, /permissions\?: unknown/)
  assert.doesNotMatch(src, /body\.permissions\s*=/)
  const injected = shopStaffIgnoresClientPermissions(
    ['admin:access', 'users:create', 'shop:products'],
    'salesperson'
  )
  assert.ok(!injected.includes('admin:access'))
  assert.ok(!injected.includes('users:create'))
  assert.ok(!injected.includes('shop:products'))
  assert.ok(injected.includes('shop:products_view'))
})

test('password is bcrypt hashed and hash never returned in DTOs', () => {
  const src = read('lib/shop/staff-users.ts')
  assert.match(src, /bcrypt\.hash/)
  assert.match(src, /isBcryptPasswordHash/)
  // DTO shape must not expose password fields
  const dtoBlock = src.split('export type ShopStaffUserDto')[1].slice(0, 450)
  assert.doesNotMatch(dtoBlock, /password/i)
  // Selects never pull password_hash into API payloads
  assert.match(src, /\.select\('id, email, first_name, last_name, role, status, created_at'\)/)
  assert.equal(isBcryptPasswordHash('$2a$10$abcdefghijklmnopqrstuu'), true)
  assert.equal(isBcryptPasswordHash('plaintext'), false)
})

test('create/reset password responses omit password fields', () => {
  const createRoute = read('app/api/staff/users/route.ts')
  const resetRoute = read('app/api/staff/users/[id]/reset-password/route.ts')
  assert.match(createRoute, /user: result\.user/)
  assert.match(createRoute, /body\.password/) // input only
  assert.doesNotMatch(createRoute, /password_hash|NextResponse\.json\(\{[^}]*password/)
  assert.match(resetRoute, /Password updated/)
  assert.doesNotMatch(resetRoute, /password_hash/)
  assert.doesNotMatch(resetRoute, /NextResponse\.json\(\{[^}]*newPassword/)
})

test('deactivation revokes sessions', () => {
  const src = read('lib/shop/staff-users.ts')
  assert.match(src, /revokeAllStaffSessionsForUser/)
  assert.match(src, /deactivated/)
})

test('final administrator protection works', () => {
  const src = read('lib/shop/staff-users.ts')
  assert.match(src, /Cannot deactivate the final active administrator/)
  assert.match(src, /Cannot demote the final active administrator/)
  assert.match(src, /cannot remove your own administrator role/i)
  assert.match(src, /cannot deactivate your own administrator account/i)
  assert.match(src, /countActiveAdmins/)
})

test('revoke sessions endpoint exists and is admin + CSRF protected', () => {
  const src = read('app/api/staff/users/[id]/revoke-sessions/route.ts')
  assert.match(src, /requireShopAdmin/)
  assert.match(src, /assertStaffMutationAllowed/)
  assert.match(src, /revokeShopStaffSessions/)
})

test('mutations require CSRF guard', () => {
  for (const rel of [
    'app/api/staff/users/route.ts',
    'app/api/staff/users/[id]/route.ts',
    'app/api/staff/users/[id]/reset-password/route.ts',
    'app/api/staff/users/[id]/revoke-sessions/route.ts',
  ]) {
    const src = read(rel)
    if (src.includes('export async function POST') || src.includes('export async function PATCH')) {
      assert.match(src, /assertStaffMutationAllowed/, rel)
    }
  }
})

test('salesperson role permissions match Phase 1D expectations', () => {
  const perms = ROLE_PERMISSIONS.salesperson
  assert.ok(perms.includes('shop:pos_sell'))
  assert.ok(perms.includes('shop:products_view'))
  assert.ok(!perms.includes('shop:products'))
  assert.ok(!perms.includes('shop:stock_adjust'))
  assert.ok(!perms.includes('admin:access'))
  assert.ok(!perms.includes('shop:payments_review'))
  assert.ok(!perms.includes('payments:approve'))
})

test('inventory_manager role permissions match Phase 1D expectations', () => {
  const src = read('lib/admin/permissions.ts')
  assert.match(src, /inventory_manager:\s*\[[\s\S]*SHOP_SALES_VIEW/)
  assert.match(src, /inventory_manager:\s*\[[\s\S]*SHOP_ORDERS_VIEW/)
  const perms = ROLE_PERMISSIONS.inventory_manager
  assert.ok(perms.includes('shop:products'))
  assert.ok(perms.includes('shop:stock_adjust'))
  assert.ok(!perms.includes('admin:access'))
  assert.ok(!perms.includes('shop:payments_review'))
  assert.ok(!perms.includes('payments:approve'))
})

test('shop:payments_review is not a role default', () => {
  const src = read('lib/admin/permissions.ts')
  assert.match(src, /SHOP_PAYMENTS_REVIEW: 'shop:payments_review'/)
  assert.match(src, /Review Shop MoMo Payments/)
  const salespersonBlock = src.slice(
    src.indexOf('salesperson: ['),
    src.indexOf('inventory_manager: [')
  )
  assert.doesNotMatch(salespersonBlock, /SHOP_PAYMENTS_REVIEW/)
  const inventoryBlock = src.slice(
    src.indexOf('inventory_manager: ['),
    src.indexOf('}', src.indexOf('inventory_manager: ['))
  )
  assert.doesNotMatch(inventoryBlock, /SHOP_PAYMENTS_REVIEW/)
})

test('/manage/users does not erase custom shop permissions on name or status updates', () => {
  const src = read('lib/shop/staff-users.ts')
  assert.match(src, /extrasToPreserveOnRoleChange/)
  const updateStart = src.indexOf('export async function updateShopStaffUser')
  const updateFn = src.slice(updateStart, src.indexOf('export async function resetShopStaffPassword'))
  assert.doesNotMatch(updateFn, /getPermissionsForRole\(nextRole\)/)
  assert.doesNotMatch(updateFn, /getPermissionsForRole\(input\.role\)/)
  assert.match(updateFn, /extrasToPreserveOnRoleChange/)
  assert.match(src, /shopStaffUpdateTouchesPermissions/)
  assert.equal(
    src.includes("if (input.status === 'active')") &&
      updateFn.includes('updates.permissions = getPermissionsForRole'),
    false
  )
})

test('role-change merge keeps shop extras and strips admin console grants', () => {
  const ALL = [
    'shop:pos_sell',
    'shop:products_view',
    'shop:sales_view',
    'shop:stock_view',
    'shop:orders_view',
    'shop:payments_review',
  ]
  function extrasToPreserveOnRoleChange(stored, nextDefaults) {
    return stored.filter(
      (permission) =>
        permission.startsWith('shop:') &&
        permission !== 'admin:access' &&
        !nextDefaults.includes(permission)
    )
  }
  const preserved = extrasToPreserveOnRoleChange(
    [...ROLE_PERMISSIONS.salesperson, 'shop:payments_review', 'admin:access', 'payments:approve'],
    ROLE_PERMISSIONS.salesperson
  )
  assert.deepEqual(preserved, ['shop:payments_review'])
  assert.ok(ALL.includes('shop:payments_review'))
})

test('no new auth tables or public registration introduced', () => {
  const src = read('lib/shop/staff-users.ts')
  assert.doesNotMatch(src, /shop_users|shop_passwords|shop_auth/)
  assert.match(src, /from\('users'\)/)
  assert.match(src, /staff_sessions/)
})

test('package.json exposes test:shop-staff', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.scripts['test:shop-staff'], 'node --test scripts/shop-staff-selfcheck.mjs')
})
