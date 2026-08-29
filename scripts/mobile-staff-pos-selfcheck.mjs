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
import { fileURLToPath, pathToFileURL } from 'node:url'

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
    'app/customer/_layout.tsx',
    'app/customer/index.tsx',
    'app/customer/categories.tsx',
    'app/customer/search.tsx',
    'app/customer/cart.tsx',
    'app/customer/language.tsx',
    'app/customer/product/[slug].tsx',
    'app/staff/_layout.tsx',
    'app/staff/index.tsx',
    'app/staff/pos.tsx',
    'app/staff/scan.tsx',
    'app/staff/orders/index.tsx',
    'app/staff/orders/[id].tsx',
    'app/staff/sales/_layout.tsx',
    'app/staff/sales/index.tsx',
    'app/staff/sales/[id].tsx',
    'app/staff/products.tsx',
    'app/staff/inventory.tsx',
    'app/staff/settings.tsx',
    'src/api/client.ts',
    'src/api/staff.ts',
    'src/auth/secure-session.ts',
    'src/auth/session-store.ts',
    'src/permissions.ts',
    'src/features/devices/index.ts',
    'src/features/shop/cart-store.ts',
    'src/i18n/locale-store.ts',
    'src/features/pos/cart-store.ts',
    'src/features/pos/pricing.ts',
    'src/features/pos/barcode-lookup.ts',
    'src/features/pos/barcode-match.ts',
    'src/features/pos/barcode-permission.ts',
    'src/ui/StaffTabButton.tsx',
    'src/ui/ProofViewer.tsx',
    'src/ui/RequireStaffNav.tsx',
    'src/ui/ConfirmDialog.tsx',
    'src/ui/BackLink.tsx',
    'src/ui/Input.tsx',
    'src/fonts.ts',
    'src/api/errors.ts',
    'src/api/query-client.ts',
    'src/features/pos/idempotency.ts',
    'src/navigation/use-back-to-more.ts',
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
  assert.match(pos, /\/staff\/scan/)
  assert.match(read('src/features/pos/hooks.ts'), /barcode/)
})

test('staff mode lives under /staff so / can become customer home later', () => {
  const index = read('app/index.tsx')
  const login = read('app/login.tsx')
  const settings = read('app/staff/settings.tsx')
  const customer = read('app/customer/_layout.tsx')
  assert.match(index, /\/customer/)
  assert.match(index, /Customer home/)
  assert.match(customer, /Tabs/)
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
  assert.match(proof, /View payment proof|enlarge/)
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
  assert.match(errors, /Unable to connect\. Check your connection and try again\./)
  assert.match(errors, /You don't have permission to perform this action\./)
  assert.match(errors, /Your session has expired\. Please sign in again\./)
  assert.match(errors, /Something went wrong\. Please try again\./)
  assert.match(errors, /LOOKS_INTERNAL/)
})

test('customer mode remains reserved and device control remains a stub', () => {
  const index = read('app/index.tsx')
  const devices = read('src/features/devices/index.ts')
  assert.match(index, /Customer home/)
  assert.match(devices, /DEVICE_CONTROL_ENABLED = false/)
})

test('POS retail layout uses search, cart checkout, and till MoMo copy', () => {
  const pos = read('app/staff/pos.tsx')
  const search = read('src/ui/SearchField.tsx')
  const picker = read('src/ui/PaymentMethodPicker.tsx')
  const proof = read('src/ui/ProofViewer.tsx')
  const orders = read('app/staff/orders/index.tsx')
  const theme = read('src/theme.ts')
  const confirm = read('src/features/pos/confirm-sale.ts')
  const sheet = read('src/ui/ConfirmDialog.tsx')
  const productRow = read('src/features/pos/ProductRow.tsx')
  const cartBar = read('src/features/pos/CartBar.tsx')
  assert.match(search, /Search products or SKU/)
  assert.match(search, /search-outline/)
  assert.match(search, /accessibilityLabel="Scan barcode"/)
  assert.match(pos, /router\.push\('\/staff\/scan'\)/)
  assert.doesNotMatch(pos, /onBarcodePlaceholder|Camera scanning is not available yet/)
  assert.match(pos, /Record MoMo payment/)
  assert.match(pos, /Confirm sale/)
  assert.match(pos, /Pending review/)
  assert.match(pos, /Checkout/)
  assert.match(pos, /confirmTillSale/)
  assert.match(pos, /setCategoryChips\(\(current\) =>/)
  assert.doesNotMatch(pos, /lookup\.data\?\.items \?\? \[\]/)
  assert.doesNotMatch(confirm, /Alert\.alert/)
  assert.doesNotMatch(pos, /Alert\.alert/)
  assert.match(sheet, /ConfirmDialog/)
  assert.match(pos, /ConfirmDialog/)
  assert.match(confirm, /Cancel/)
  assert.match(confirm, /formatRwf/)
  assert.match(confirm, /REAL SALE \/ PAYMENT ACTION/)
  assert.match(confirm, /Payment:/)
  assert.match(confirm, /cancelLabel: 'Cancel'/)
  assert.match(confirm, /\$\{line\.quantity\} × \$\{line\.name\}/)
  assert.match(pos, /quantity: line\.quantity/)
  assert.doesNotMatch(pos, /onChange=\{setMethod\}[\s\S]{0,80}submitSale/)
  assert.match(picker, /CASH/)
  assert.match(picker, /MoMo/)
  assert.match(orders, /MoMo payment needs review/)
  assert.match(orders, /canReviewShopPayments/)
  assert.match(proof, /cachePolicy/)
  assert.doesNotMatch(proof, /FileSystem|downloadAsync|MediaLibrary/)
  assert.match(theme, /#1e3a5f/)
  assert.match(theme, /#d97706/)
  assert.match(theme, /screenTitle/)
  assert.match(theme, /dockTotal/)
  assert.match(theme, /productName/)
  assert.match(productRow, /\{sku\}/)
  assert.match(productRow, /in stock/)
  assert.match(productRow, /formatRwf\(unitPrice\)/)
  assert.match(productRow, /type\.price/)
  assert.match(cartBar, /dockTotal/)
  assert.match(cartBar, /CHECKOUT/)
})

test('bottom tabs expose TalkBack labels without growing the bar', () => {
  const layout = read('app/staff/_layout.tsx')
  const tabButton = read('src/ui/StaffTabButton.tsx')
  assert.match(layout, /makeStaffTabButton\('POS'\)/)
  assert.match(layout, /makeStaffTabButton\('Orders'\)/)
  assert.match(layout, /makeStaffTabButton\('Dashboard'\)/)
  assert.match(layout, /makeStaffTabButton\('More'\)/)
  assert.match(tabButton, /accessibilityRole="tab"/)
  assert.match(tabButton, /\$\{label\}, selected/)
  assert.match(tabButton, /minHeight: 48/)
  assert.match(tabButton, /aria-selected/)
  assert.doesNotMatch(layout, /height: 80|height: 88|height: 96/)
})

test('barcode lookup uses the staff products API and never talks to Supabase', async () => {
  const lookup = read('src/features/pos/barcode-lookup.ts')
  const staff = read('src/api/staff.ts')
  const scan = read('app/staff/scan.tsx')
  const files = walk(mobile)
    .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  assert.match(lookup, /fetchProducts\(\{ barcode: code/)
  assert.match(lookup, /No product found for this barcode\./)
  assert.match(lookup, /Unable to find product\. Check your connection\./)
  assert.match(staff, /\/api\/staff\/products/)
  assert.match(scan, /lookupProductByBarcode/)
  assert.doesNotMatch(files, /createClient|SUPABASE_SERVICE_ROLE|supabaseAdmin/)
  assert.doesNotMatch(scan, /\/api\/admin\//)

  const { pickBarcodeMatch } = await import(
    pathToFileURL(join(mobile, 'src/features/pos/barcode-match.ts')).href
  )
  assert.equal(
    pickBarcodeMatch([{ id: 'a', barcode: '123' }], '123')?.id,
    'a'
  )
  assert.equal(pickBarcodeMatch([], '123'), null)
  assert.equal(
    pickBarcodeMatch([{ id: 'only', barcode: null }], '123')?.id,
    'only'
  )
  assert.equal(
    pickBarcodeMatch(
      [
        { id: 'a', barcode: '123' },
        { id: 'b', barcode: '123' },
      ],
      '123'
    ),
    null
  )
  assert.equal(
    pickBarcodeMatch(
      [
        { id: 'a', barcode: '111' },
        { id: 'b', barcode: '222' },
      ],
      '123'
    ),
    null
  )
})

test('camera permission is camera-only and does not re-prompt after permanent denial', async () => {
  const app = JSON.parse(read('app.json'))
  const pkg = JSON.parse(read('package.json'))
  const scan = read('app/staff/scan.tsx')
  const perm = read('src/features/pos/barcode-permission.ts')
  const plugin = app.expo.plugins.find(
    (entry) => Array.isArray(entry) && entry[0] === 'expo-camera'
  )
  assert.equal(pkg.dependencies['expo-camera'], '~17.0.10')
  assert.ok(plugin)
  assert.equal(plugin[1].cameraPermission, 'Allow camera access to scan products.')
  assert.equal(plugin[1].recordAudioAndroid, false)
  assert.equal(plugin[1].microphonePermission, false)
  assert.deepEqual(app.expo.android.permissions, ['INTERNET'])
  assert.doesNotMatch(JSON.stringify(app), /RECORD_AUDIO|ACCESS_FINE_LOCATION|READ_CONTACTS|BLUETOOTH/)
  assert.match(scan, /shouldRequestCameraPermission/)
  assert.match(scan, /CAMERA_PERMISSION_BLOCKED/)
  assert.match(scan, /Return to POS/)
  assert.match(perm, /Allow camera access to scan products\./)

  const { cameraPermissionPhase, shouldRequestCameraPermission } = await import(
    pathToFileURL(join(mobile, 'src/features/pos/barcode-permission.ts')).href
  )
  assert.equal(cameraPermissionPhase(null), 'loading')
  assert.equal(cameraPermissionPhase({ granted: true, canAskAgain: true }), 'ready')
  assert.equal(cameraPermissionPhase({ granted: false, canAskAgain: true }), 'prompt')
  assert.equal(cameraPermissionPhase({ granted: false, canAskAgain: false }), 'blocked')
  assert.equal(shouldRequestCameraPermission({ granted: false, canAskAgain: false }), false)
  assert.equal(shouldRequestCameraPermission({ granted: false, canAskAgain: true }), true)
})

test('scan flow locks while looking up and does not add out-of-stock products', () => {
  const scan = read('app/staff/scan.tsx')
  const pos = read('app/staff/pos.tsx')
  assert.match(scan, /from 'expo-camera'/)
  assert.match(scan, /CameraView/)
  assert.match(scan, /onBarcodeScanned=\{processing \? undefined/)
  assert.match(scan, /processingRef/)
  assert.match(scan, /stayOnScanner = false/)
  assert.match(scan, /addProduct\(lookup\.product\)/)
  assert.match(scan, /ean13/)
  assert.match(scan, /code128/)
  assert.match(scan, /upc_a/)
  assert.match(scan, /setFound\(lookup\.product\)/)
  assert.match(scan, /RequireStaffNav navKey="pos"/)
  assert.match(pos, /router\.push\('\/staff\/scan'\)/)
  assert.doesNotMatch(scan, /reviewShopPayment|\/api\/staff\/payments\/review/)
})

test('POS till sales stay on the POS sales API and never use payment review', () => {
  const pos = read('app/staff/pos.tsx')
  const hooks = read('src/features/pos/hooks.ts')
  const confirm = read('src/features/pos/confirm-sale.ts')
  const order = read('app/staff/orders/[id].tsx')
  const permissions = read('src/permissions.ts')
  assert.match(hooks, /createPosSale/)
  assert.match(hooks, /inflightCheckout/)
  assert.doesNotMatch(pos, /reviewShopPayment|\/api\/staff\/payments\/review/)
  assert.doesNotMatch(hooks, /reviewShopPayment|\/api\/staff\/payments\/review/)
  assert.match(confirm, /Record MoMo payment/)
  assert.match(confirm, /does not approve an online customer payment/)
  assert.match(order, /canReviewShopPayments/)
  assert.match(order, /isOnlineOrder/)
  assert.match(order, /channel === 'online'/)
  assert.doesNotMatch(permissions, /payments:approve/)
})

test('cart quantity below 1 removes the line and drops the checkout attempt', () => {
  const cart = read('src/features/pos/cart-store.ts')
  assert.match(cart, /quantity < 1/)
  assert.match(cart, /dropCheckoutAttempt/)
  assert.match(cart, /checkoutFingerprint === fingerprint/)
})

test('refunds are not on POS checkout and Sales uses a confirmation dialog', () => {
  const pos = read('app/staff/pos.tsx')
  const sales = read('app/staff/sales/index.tsx')
  const detail = read('app/staff/sales/[id].tsx')
  const confirm = read('src/features/refunds/confirm-refund.ts')
  const hooks = read('src/features/refunds/hooks.ts')
  assert.doesNotMatch(pos, /label="Refund"/)
  assert.match(pos, /Confirm sale/)
  assert.match(sales, /refundStatusLabel/)
  assert.match(detail, /confirmShopRefund/)
  assert.match(detail, /label="Refund"/)
  assert.match(detail, /This staff session cannot request refunds/)
  assert.match(confirm, /cancelLabel: 'Cancel'/)
  assert.match(confirm, /REFUND ACTION/)
  assert.doesNotMatch(confirm, /Alert\.alert/)
  assert.doesNotMatch(detail, /Alert\.alert/)
  assert.match(detail, /ConfirmDialog/)
  assert.match(hooks, /inflightRefund/)
})

test('More destinations return to More on hardware back and keep the sale stack intact', () => {
  const back = read('src/navigation/use-back-to-more.ts')
  const products = read('app/staff/products.tsx')
  const inventory = read('app/staff/inventory.tsx')
  const settings = read('app/staff/settings.tsx')
  const sales = read('app/staff/sales/index.tsx')
  const saleDetail = read('app/staff/sales/[id].tsx')
  const chips = read('src/ui/FilterChips.tsx')
  const screen = read('src/ui/Screen.tsx')
  assert.match(back, /useFocusEffect/)
  assert.match(back, /router\.replace\('\/staff\/menu'\)/)
  assert.match(products, /useBackToMore/)
  assert.match(inventory, /useBackToMore/)
  assert.match(settings, /useBackToMore/)
  assert.match(sales, /useBackToMore/)
  assert.doesNotMatch(saleDetail, /useBackToMore/)
  assert.match(chips, /\$\{item\.label\}, selected/)
  assert.match(screen, /paddingBottom: 96/)
})

test('Staff POS design system uses IBM Plex, semantic tokens, and branded confirmation', () => {
  const theme = read('src/theme.ts')
  const layout = read('app/_layout.tsx')
  const fonts = read('src/fonts.ts')
  const app = JSON.parse(read('app.json'))
  const pos = read('app/staff/pos.tsx')
  const dashboard = read('app/staff/index.tsx')
  const sales = read('app/staff/sales/index.tsx')
  const products = read('app/staff/products.tsx')
  const inventory = read('app/staff/inventory.tsx')
  const login = read('app/login.tsx')
  const button = read('src/ui/Button.tsx')
  const sheet = read('src/ui/ConfirmDialog.tsx')
  const productRow = read('src/features/pos/ProductRow.tsx')
  const cartBar = read('src/features/pos/CartBar.tsx')
  const saleConfirm = read('src/features/pos/confirm-sale.ts')

  assert.match(theme, /IBMPlexSans_400Regular/)
  assert.match(theme, /IBMPlexSans_700Bold/)
  assert.match(theme, /textPrimary/)
  assert.match(theme, /primaryPressed/)
  assert.match(theme, /successSubtle/)
  assert.match(theme, /dangerSubtle/)
  assert.match(theme, /disabledFill/)
  assert.match(theme, /checkoutTotal/)
  assert.match(theme, /fontVariant: tabular/)
  assert.doesNotMatch(theme, /fontWeight: '800'|ExtraBold/)
  assert.match(fonts, /IBMPlexSans-Regular\.ttf/)
  assert.match(layout, /useFonts\(plexFontMap\)/)
  assert.match(layout, /SplashScreen\.preventAutoHideAsync/)
  assert.match(layout, /SplashScreen\.hideAsync/)
  assert.match(layout, /fontsReady && localeReady/)
  assert.match(layout, /hydrateSession/)
  assert.doesNotMatch(layout, /setTimeout\(/)
  assert.equal(app.expo.name, 'Energy & Logics')
  assert.match(JSON.stringify(app), /brand-mark\.png/)
  assert.doesNotMatch(JSON.stringify(app), /Nyanza Shop Staff/)

  assert.match(button, /type Variant = 'primary' \| 'secondary' \| 'tertiary' \| 'danger'/)
  assert.match(sheet, /accessibilityViewIsModal/)
  assert.match(sheet, /onRequestClose=\{onCancel\}/)
  assert.doesNotMatch(pos, /Alert\.alert/)
  assert.match(pos, /setSaleSheet/)
  assert.match(pos, /submitSale\(\)/)
  assert.match(saleConfirm, /accessibilityConfirmLabel/)
  assert.match(productRow, /maxFontSizeMultiplier=\{1\.3\}/)
  assert.match(productRow, /ADD/)
  assert.match(productRow, /OUT/)
  assert.doesNotMatch(productRow, /\+ ADD/)
  assert.match(cartBar, /colors\.primary/)
  assert.match(dashboard, /Action required/)
  assert.match(dashboard, /router\.push\('\/staff\/orders'\)/)
  assert.match(dashboard, /router\.push\('\/staff\/inventory'\)/)
  assert.match(dashboard, /Today's sales/)
  assert.doesNotMatch(sales, /<Card/)
  assert.doesNotMatch(products, /<Card/)
  assert.doesNotMatch(inventory, /<Card/)
  assert.match(login, /accessibilityLabel="Email"/)
  assert.match(login, /accessibilityLabel="Password"/)
  assert.match(login, /Staff POS/)
  assert.doesNotMatch(login, /fontWeight: '800'/)
})

test('Phase 1E.5-K retail POS polish keeps till hierarchy and portrait lock', () => {
  const productRow = read('src/features/pos/ProductRow.tsx')
  const search = read('src/ui/SearchField.tsx')
  const qty = read('src/ui/QtyStepper.tsx')
  const orders = read('app/staff/orders/index.tsx')
  const sales = read('app/staff/sales/index.tsx')
  const inventory = read('app/staff/inventory.tsx')
  const dashboard = read('app/staff/index.tsx')
  const app = JSON.parse(read('app.json'))
  const sheet = read('src/ui/ConfirmDialog.tsx')

  assert.match(productRow, /flexShrink: 1/)
  assert.match(productRow, /metaFixed/)
  assert.match(search, /minWidth: 0/)
  assert.match(search, /flexShrink: 0/)
  assert.match(qty, /name="remove"/)
  assert.match(qty, /name="add"/)
  assert.match(qty, /borderWidth: 2/)
  assert.match(orders, /No orders yet/)
  assert.match(orders, /Couldn't load orders/)
  assert.match(sales, /No sales yet/)
  assert.match(sales, /Open sale/)
  assert.match(inventory, /OUT/)
  assert.match(dashboard, /products need attention/)
  assert.match(dashboard, /actionLabel="Inventory"/)
  assert.equal(app.expo.orientation, 'portrait')
  assert.doesNotMatch(sheet, /Alert\.alert/)
  assert.match(sheet, /onRequestClose=\{onCancel\}/)
})

test('Phase 1E.5-L professional retail POS UX keeps till hierarchy without commerce changes', () => {
  const theme = read('src/theme.ts')
  const fonts = read('src/fonts.ts')
  const layout = read('app/_layout.tsx')
  const tabs = read('app/staff/_layout.tsx')
  const tabButton = read('src/ui/StaffTabButton.tsx')
  const productRow = read('src/features/pos/ProductRow.tsx')
  const search = read('src/ui/SearchField.tsx')
  const chips = read('src/ui/FilterChips.tsx')
  const qty = read('src/ui/QtyStepper.tsx')
  const cartLine = read('src/features/pos/CartLineRow.tsx')
  const cartBar = read('src/features/pos/CartBar.tsx')
  const cart = read('src/features/pos/cart-store.ts')
  const pos = read('app/staff/pos.tsx')
  const sheet = read('src/ui/ConfirmDialog.tsx')
  const saleConfirm = read('src/features/pos/confirm-sale.ts')
  const refundConfirm = read('src/features/refunds/confirm-refund.ts')
  const payment = read('src/ui/PaymentMethodPicker.tsx')
  const dashboard = read('app/staff/index.tsx')
  const orders = read('app/staff/orders/index.tsx')
  const sales = read('app/staff/sales/index.tsx')
  const inventory = read('app/staff/inventory.tsx')
  const products = read('app/staff/products.tsx')
  const menu = read('app/staff/menu.tsx')
  const button = read('src/ui/Button.tsx')
  const hooks = read('src/features/pos/hooks.ts')
  const app = JSON.parse(read('app.json'))

  const uiSources = walk(join(mobile, 'app'))
    .concat(walk(join(mobile, 'src')))
    .filter((file) => ['.ts', '.tsx'].includes(extname(file)))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')

  assert.match(theme, /IBMPlexSans_400Regular/)
  assert.match(theme, /IBMPlexSans_500Medium/)
  assert.match(theme, /IBMPlexSans_600SemiBold/)
  assert.match(theme, /IBMPlexSans_700Bold/)
  assert.match(theme, /textOnPrimaryMuted/)
  assert.match(theme, /dangerPressed/)
  assert.match(theme, /scrim/)
  assert.match(theme, /tillTitle/)
  assert.match(theme, /confirmTitle/)
  assert.match(theme, /fontVariant: tabular/)
  assert.doesNotMatch(theme, /fontWeight: '800'|ExtraBold/)
  assert.doesNotMatch(uiSources, /fontWeight:\s*['"]800['"]|ExtraBold/)
  assert.match(fonts, /IBMPlexSans-Regular\.ttf/)
  assert.match(layout, /useFonts\(plexFontMap\)/)
  assert.match(layout, /fontsReady && localeReady/)
  assert.match(layout, /hydrateSession/)

  assert.match(search, /control\.searchHeight/)
  assert.match(search, /minWidth: 0/)
  assert.match(search, /flexShrink: 0/)
  assert.match(search, /Scan barcode/)
  assert.match(search, /fieldFocus/)
  assert.match(search, /barcode-outline/)

  assert.match(chips, /name="checkmark"/)
  assert.match(chips, /chipOn/)
  assert.match(chips, /\$\{item\.label\}, selected/)
  assert.doesNotMatch(chips, /maxWidth:\s*180/)

  assert.match(productRow, /type\.price/)
  assert.match(productRow, /flexShrink: 1/)
  assert.match(productRow, /metaFixed/)
  assert.match(productRow, /in stock/)
  assert.match(productRow, /Add \$\{product\.name\} to cart/)
  assert.match(productRow, /\$\{product\.name\} is out of stock/)
  assert.match(productRow, /name="add"/)
  assert.match(productRow, /\bADD\b/)
  assert.match(productRow, /OUT/)
  assert.doesNotMatch(productRow, /\+ ADD/)
  assert.doesNotMatch(productRow, /Out of stock/)

  assert.match(qty, /name="remove"/)
  assert.match(qty, /name="add"/)
  assert.match(qty, /value <= min/)
  assert.match(qty, /decreaseDisabled/)
  assert.match(cartLine, /min=\{1\}/)
  assert.match(pos, /item\.quantity <= 1/)
  assert.match(cart, /quantity < 1/)
  assert.match(cart, /dropCheckoutAttempt/)

  assert.match(cartBar, /colors\.primary/)
  assert.match(cartBar, /View cart and checkout/)
  assert.match(cartBar, /CHECKOUT/)
  assert.match(pos, /!keyboardOpen/)

  assert.match(payment, /payment, \$\{selected \? 'selected' : 'not selected'\}/)
  assert.match(payment, /name="checkmark-circle"/)
  assert.match(pos, /REAL SALE \/ PAYMENT ACTION/)
  assert.match(saleConfirm, /Confirm sale for \$\{itemsSpoken\} totaling/)
  assert.match(sheet, /onRequestClose=\{onCancel\}/)
  assert.doesNotMatch(sheet, /overlay[\s\S]{0,120}onPress/)
  assert.doesNotMatch(sheet, /Alert\.alert/)
  assert.doesNotMatch(pos, /Alert\.alert/)
  assert.doesNotMatch(refundConfirm, /Alert\.alert/)
  assert.match(refundConfirm, /REFUND ACTION/)

  assert.match(dashboard, /Today's sales/)
  assert.match(dashboard, /Action required/)
  assert.match(dashboard, /payments waiting/)
  assert.match(dashboard, /orders waiting/)
  assert.match(dashboard, /products need attention/)
  assert.match(dashboard, /actionLabel="Review"/)
  assert.match(dashboard, /pendingMomo == null \? '—'/)
  assert.doesNotMatch(dashboard, /None waiting/)

  assert.match(orders, /No orders yet/)
  assert.match(orders, /itemAlert/)
  assert.match(orders, /itemRecede/)
  assert.match(sales, /No sales yet/)
  assert.match(sales, /Open sale/)
  assert.match(sales, /refundStatusLabel/)
  assert.match(sales, /type\.lineTotal/)
  assert.doesNotMatch(sales, /itemAlert/)
  assert.match(inventory, /currentStock/)
  assert.match(inventory, /OUT/)
  assert.match(inventory, /LOW/)
  assert.doesNotMatch(inventory, /rowOut|rowAlert/)
  assert.doesNotMatch(inventory, /Out of stock/)
  assert.match(products, /Stock \{product\.stock\}/)
  assert.match(menu, /MORE_ORDER/)

  assert.match(tabButton, /\$\{label\}, selected/)
  assert.match(tabButton, /accessibilityRole="tab"/)
  assert.match(tabButton, /hitOn/)
  assert.match(tabs, /makeStaffTabButton\('POS'\)/)
  assert.match(tabs, /makeStaffTabButton\('Orders'\)/)
  assert.match(tabs, /makeStaffTabButton\('Dashboard'\)/)
  assert.match(tabs, /makeStaffTabButton\('More'\)/)
  assert.equal(app.expo.orientation, 'portrait')

  assert.match(button, /type Variant = 'primary' \| 'secondary' \| 'tertiary' \| 'danger'/)
  assert.match(hooks, /inflightCheckout/)
  assert.doesNotMatch(uiSources, /Alert\.alert/)
  assert.doesNotMatch(uiSources, /[←→★☆⚠🔍🛒➕➖✅❌]/)
})

