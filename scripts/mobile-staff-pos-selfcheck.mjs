/**
 * Android staff POS foundation self-check (Phase 1E.5-B).
 * Run: pnpm test:mobile
 *
 * Does not require Expo install. Asserts architecture, security, and nav rules.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mobile = join(root, 'apps', 'mobile')

const PERMISSIONS = {
  SHOP_POS_SELL: 'shop:pos_sell',
  SHOP_ORDERS_VIEW: 'shop:orders_view',
  SHOP_ORDERS_MANAGE: 'shop:orders_manage',
  SHOP_PAYMENTS_REVIEW: 'shop:payments_review',
  SHOP_ORDERS: 'shop:orders',
  SHOP_PRODUCTS_VIEW: 'shop:products_view',
  SHOP_PRODUCTS: 'shop:products',
  SHOP_STOCK_VIEW: 'shop:stock_view',
  SHOP_SALES_VIEW: 'shop:sales_view',
}

const STAFF_NAV_ITEMS = [
  { key: 'dashboard', href: '/staff', permissions: [] },
  { key: 'pos', href: '/staff/pos', permissions: [PERMISSIONS.SHOP_POS_SELL] },
  { key: 'orders', href: '/staff/orders', permissions: [PERMISSIONS.SHOP_ORDERS_VIEW] },
  {
    key: 'sales',
    href: '/staff/sales',
    permissions: [PERMISSIONS.SHOP_SALES_VIEW, PERMISSIONS.SHOP_ORDERS_VIEW],
  },
  {
    key: 'products',
    href: '/staff/products',
    permissions: [PERMISSIONS.SHOP_PRODUCTS_VIEW, PERMISSIONS.SHOP_PRODUCTS],
  },
  { key: 'inventory', href: '/staff/inventory', permissions: [PERMISSIONS.SHOP_STOCK_VIEW] },
  { key: 'settings', href: '/staff/settings', permissions: [] },
]

function hasPermission(permissions, required) {
  if (!permissions?.length) return false
  const list = Array.isArray(required) ? required : [required]
  return list.some((key) => permissions.includes(key))
}

function canSeeStaffNavItem(permissions, item) {
  if (!item.permissions.length) return true
  return hasPermission(permissions, item.permissions)
}

function filterStaffNavItems(permissions) {
  return STAFF_NAV_ITEMS.filter((item) => canSeeStaffNavItem(permissions, item)).map(
    (item) => item.key
  )
}

function canReviewShopPayments(permissions) {
  return hasPermission(permissions, [
    PERMISSIONS.SHOP_PAYMENTS_REVIEW,
    PERMISSIONS.SHOP_ORDERS,
  ])
}

function canAccessStaffPath(pathname, permissions) {
  const matches = STAFF_NAV_ITEMS.filter(
    (entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`)
  )
  if (!matches.length) return true
  const item = matches.sort((a, b) => b.href.length - a.href.length)[0]
  return canSeeStaffNavItem(permissions, item)
}

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

function cartCheckoutItems(lines) {
  return lines.map((line) => ({ productId: line.productId, quantity: line.quantity }))
}

function checkoutFingerprint(items, paymentMethod) {
  return JSON.stringify({
    items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    paymentMethod,
  })
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.expo' || name === 'dist') continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

function read(rel) {
  return readFileSync(join(mobile, rel), 'utf8')
}

test('mobile app foundation files exist', () => {
  for (const rel of [
    'package.json',
    'app.json',
    'eas.json',
    'app/_layout.tsx',
    'app/index.tsx',
    'app/login.tsx',
    'app/staff/_layout.tsx',
    'app/staff/index.tsx',
    'app/staff/pos.tsx',
    'app/staff/orders/index.tsx',
    'app/staff/orders/[id].tsx',
    'app/staff/sales.tsx',
    'app/staff/products.tsx',
    'app/staff/inventory.tsx',
    'app/staff/settings.tsx',
    'src/api/client.ts',
    'src/api/staff.ts',
    'src/auth/secure-session.ts',
    'src/auth/session-store.ts',
    'src/permissions.ts',
    'src/features/devices/index.ts',
    'src/features/pos/cart-store.ts',
    'src/features/pos/pricing.ts',
    'src/ui/ProofViewer.tsx',
    'src/ui/RequireStaffNav.tsx',
    'src/api/errors.ts',
    'src/api/query-client.ts',
    'src/features/pos/idempotency.ts',
  ]) {
    assert.ok(existsSync(join(mobile, rel)), rel)
  }
})

test('root TypeScript config excludes the Expo app', () => {
  const tsconfig = readFileSync(join(root, 'tsconfig.json'), 'utf8')
  assert.match(tsconfig, /"apps"/)
})

test('Android app never contains service-role or privileged DB credentials', () => {
  const files = walk(mobile).filter((file) =>
    ['.ts', '.tsx', '.js', '.json', '.example'].includes(extname(file))
  )
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    assert.doesNotMatch(src, /SUPABASE_SERVICE_ROLE_KEY/)
    assert.doesNotMatch(src, /service_role/i)
  }
  const envExample = read('.env.example')
  assert.match(envExample, /EXPO_PUBLIC_API_BASE_URL/)
  assert.doesNotMatch(envExample, /SERVICE_ROLE|DATABASE_URL|POSTGRES/)
})

test('session token is stored in SecureStore, not AsyncStorage or Zustand persist', () => {
  const secure = read('src/auth/secure-session.ts')
  const session = read('src/auth/session-store.ts')
  assert.match(secure, /expo-secure-store/)
  assert.match(secure, /el\.staff\.session\.token/)
  assert.doesNotMatch(secure, /AsyncStorage/)
  assert.doesNotMatch(session, /persist\(|AsyncStorage|createJSONStorage/)
  assert.match(session, /writeStaffToken|readStaffToken|clearStaffToken/)
  assert.match(session, /expire:/)
  assert.match(session, /signOut:/)
})

test('API client attaches Bearer token and expires the session on 401', () => {
  const client = read('src/api/client.ts')
  assert.match(client, /Authorization/)
  assert.match(client, /Bearer/)
  assert.match(client, /401/)
  assert.match(client, /onUnauthorized/)
  assert.match(client, /network/i)
  const appFetch = walk(join(mobile, 'app'))
    .filter((file) => file.endsWith('.tsx'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  assert.doesNotMatch(appFetch, /\bfetch\s*\(/)
})

test('staff API module consumes existing staff endpoints', () => {
  const src = read('src/api/staff.ts')
  for (const path of [
    '/api/staff/auth',
    '/api/staff/reports/dashboard',
    '/api/staff/orders',
    '/api/staff/payments/review',
    '/api/staff/products',
    '/api/staff/inventory',
    '/api/staff/pos/sales',
  ]) {
    assert.match(src, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  assert.match(src, /decision/)
  assert.match(src, /Idempotency-Key/)
  assert.doesNotMatch(src, /createCommerceSale|reviewPaymentCore/)
})

test('payment review is authorize-and-forward only', () => {
  const review = read('src/features/payments/hooks.ts')
  const detail = read('app/staff/orders/[id].tsx')
  const perms = read('src/permissions.ts')
  assert.match(review, /reviewShopPayment/)
  assert.match(review, /decision:\s*'approve'\s*\|\s*'reject'/)
  assert.match(detail, /canReviewShopPayments/)
  assert.match(detail, /decision:\s*'approve'/)
  assert.match(detail, /decision:\s*'reject'/)
  assert.match(detail, /ProofViewer/)
  assert.match(perms, /shop:payments_review/)
})

test('salesperson and inventory-manager navigation follow existing permissions', () => {
  const salespersonPerms = [
    PERMISSIONS.SHOP_POS_SELL,
    PERMISSIONS.SHOP_ORDERS_VIEW,
    PERMISSIONS.SHOP_SALES_VIEW,
  ]
  assert.deepEqual(filterStaffNavItems(salespersonPerms), [
    'dashboard',
    'pos',
    'orders',
    'sales',
    'settings',
  ])
  assert.equal(canAccessStaffPath('/staff/inventory', salespersonPerms), false)
  assert.equal(canAccessStaffPath('/staff/pos', salespersonPerms), true)
  assert.equal(canAccessStaffPath('/staff/orders/abc', salespersonPerms), true)

  const inventoryPerms = [
    PERMISSIONS.SHOP_ORDERS_VIEW,
    PERMISSIONS.SHOP_PRODUCTS,
    PERMISSIONS.SHOP_STOCK_VIEW,
    PERMISSIONS.SHOP_SALES_VIEW,
  ]
  assert.deepEqual(filterStaffNavItems(inventoryPerms), [
    'dashboard',
    'orders',
    'sales',
    'products',
    'inventory',
    'settings',
  ])
  assert.equal(canAccessStaffPath('/staff/pos', inventoryPerms), false)
  assert.equal(canAccessStaffPath('/staff/inventory', inventoryPerms), true)
})

test('payment-review actions require shop:payments_review (or legacy shop:orders)', () => {
  assert.equal(canReviewShopPayments(['shop:orders_view']), false)
  assert.equal(canReviewShopPayments(['shop:payments_review']), true)
  assert.equal(canReviewShopPayments(['shop:orders']), true)
})

test('POS checkout sends product IDs and quantities only; preview is display-only', () => {
  const totals = previewCartTotals([
    { price: 1000, discount: 100, quantity: 2 },
    { price: 200, discount: 0, quantity: 1 },
  ])
  assert.equal(totals.listSubtotal, 2200)
  assert.equal(totals.payableTotal, 2000)
  assert.equal(totals.discountTotal, 200)
  assert.equal(previewUnitPrice(500, 600), 0)

  const payload = cartCheckoutItems([
    { productId: 'p1', quantity: 2, price: 9999, name: 'Lamp' },
  ])
  assert.deepEqual(payload, [{ productId: 'p1', quantity: 2 }])
  assert.equal('price' in payload[0], false)

  const cart = read('src/features/pos/cart-store.ts')
  const pricing = read('src/features/pos/pricing.ts')
  const pos = read('app/staff/pos.tsx')
  assert.match(cart, /productId: line\.productId/)
  assert.match(cart, /quantity: line\.quantity/)
  assert.match(pricing, /Display-only/)
  assert.match(pos, /onBarcodePlaceholder|barcode/)
  assert.match(read('src/features/pos/hooks.ts'), /barcode/)
})

test('staff mode lives under /staff so / can become customer home later', () => {
  const index = read('app/index.tsx')
  const login = read('app/login.tsx')
  const settings = read('app/staff/settings.tsx')
  assert.match(index, /\/staff/)
  assert.match(index, /customer home/i)
  assert.match(login, /useForm/)
  assert.match(login, /zodResolver/)
  assert.doesNotMatch(settings, /href=.*\/admin|canAccessAdmin/)
  assert.match(settings, /web-only/)
})

test('device control is stubbed and not implemented', () => {
  const devices = read('src/features/devices/index.ts')
  assert.match(devices, /DEVICE_CONTROL_ENABLED = false/)
  assert.doesNotMatch(devices, /from 'react-native-ble-plx'|mqtt|matter-js/)
  const pkg = JSON.parse(read('package.json'))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  for (const banned of [
    'react-native-ble-plx',
    'react-native-bluetooth-classic',
    'mqtt',
    'react-native-tcp-socket',
  ]) {
    assert.equal(deps[banned], undefined, banned)
  }
})

test('payment proof is remote-only with loading / fail / empty states', () => {
  const proof = read('src/ui/ProofViewer.tsx')
  assert.match(proof, /Tap to enlarge|enlarge/)
  assert.match(proof, /maximumZoomScale/)
  assert.match(proof, /No payment proof/)
  assert.match(proof, /could not be loaded/)
  assert.doesNotMatch(proof, /FileSystem|downloadAsync|MediaLibrary/)
  assert.match(proof, /cachePolicy/)
})

test('EAS Android package is prepared but not published', () => {
  const app = JSON.parse(read('app.json'))
  const eas = JSON.parse(read('eas.json'))
  assert.equal(app.expo.android.package, 'com.energyandlogics.staffpos')
  assert.ok(eas.build.preview)
  assert.ok(eas.build.production)
  assert.equal(app.expo.extra?.eas?.projectId, undefined)
})

test('production API host is the shop domain and is overridable', () => {
  const client = read('src/api/client.ts')
  const errors = read('src/api/errors.ts')
  const envExample = read('.env.example')
  const app = JSON.parse(read('app.json'))
  assert.match(errors, /https:\/\/shop\.energyandlogics\.com/)
  assert.match(client, /EXPO_PUBLIC_API_BASE_URL/)
  assert.match(envExample, /https:\/\/shop\.energyandlogics\.com/)
  assert.equal(app.expo.extra.apiBaseUrl, 'https://shop.energyandlogics.com')
})

test('Android never calls the admin payment-review endpoint', () => {
  const files = walk(mobile)
    .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  assert.doesNotMatch(files, /\/api\/admin\/payments\/review/)
  assert.match(read('src/api/staff.ts'), /\/api\/staff\/payments\/review/)
})

test('401 expiry clears SecureStore and sensitive query cache; login 401 does not', () => {
  const session = read('src/auth/session-store.ts')
  const staff = read('src/api/staff.ts')
  const client = read('src/api/client.ts')
  const query = read('src/api/query-client.ts')
  assert.match(session, /clearSensitiveStaffCache/)
  assert.match(session, /wipeLocalSession|clearStaffToken/)
  assert.match(query, /removeQueries|queryKey: \['staff'\]/)
  assert.match(staff, /expireOn401:\s*false/)
  assert.match(staff, /isLogin:\s*true/)
  assert.match(client, /timeoutMs/)
  assert.match(client, /notifyUnauthorized/)
  assert.match(session, /restoreError/)
})

test('POS reuses one idempotency key per checkout attempt', () => {
  const hooks = read('src/features/pos/hooks.ts')
  const cart = read('src/features/pos/cart-store.ts')
  const idem = read('src/features/pos/idempotency.ts')
  assert.match(hooks, /getOrCreateCheckoutKey/)
  assert.match(hooks, /inflightCheckout/)
  assert.match(cart, /checkoutKey/)
  assert.match(idem, /checkoutFingerprint/)
  assert.match(read('src/api/staff.ts'), /Idempotency-Key/)
  assert.doesNotMatch(hooks, /pos-\$\{Date\.now/)

  const fingerprintA = checkoutFingerprint(
    [{ productId: 'p1', quantity: 2 }],
    'cash'
  )
  const fingerprintB = checkoutFingerprint(
    [{ productId: 'p1', quantity: 2 }],
    'cash'
  )
  const fingerprintC = checkoutFingerprint(
    [{ productId: 'p1', quantity: 2 }],
    'momo'
  )
  assert.equal(fingerprintA, fingerprintB)
  assert.notEqual(fingerprintA, fingerprintC)
})

test('user-facing errors are sanitized', () => {
  const errors = read('src/api/errors.ts')
  assert.match(errors, /Unable to connect\. Check your internet connection\./)
  assert.match(errors, /You don't have permission to perform this action\./)
  assert.match(errors, /Your session has expired\. Please sign in again\./)
  assert.match(errors, /Something went wrong\. Please try again\./)
  assert.match(errors, /LOOKS_INTERNAL/)
})

test('customer mode remains reserved and device control remains a stub', () => {
  const index = read('app/index.tsx')
  const devices = read('src/features/devices/index.ts')
  assert.match(index, /customer home/i)
  assert.match(devices, /DEVICE_CONTROL_ENABLED = false/)
})
