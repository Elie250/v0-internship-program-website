/**
 * Phase 1E.3.1 — public shop storefront shell self-checks.
 * Run: pnpm test:shop-storefront
 *
 * Source inspections only — no live HTTP, no Supabase, no commerce writes.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (rel) => readFileSync(join(root, rel), 'utf8')

const STOREFRONT_FILES = [
  'app/storefront/layout.tsx',
  'app/storefront/page.tsx',
  'app/storefront/cart/page.tsx',
  'app/storefront/checkout/page.tsx',
  'app/storefront/track/page.tsx',
  'app/storefront/product/page.tsx',
  'app/storefront/product/[slug]/page.tsx',
  'app/storefront/order/page.tsx',
  'app/storefront/order/[ref]/page.tsx',
  'components/storefront/storefront-shell.tsx',
  'components/storefront/storefront-header.tsx',
  'components/storefront/storefront-footer.tsx',
  'components/storefront/storefront-home.tsx',
  'components/storefront/storefront-cart-page.tsx',
  'components/storefront/storefront-language-toggle.tsx',
  'components/storefront/storefront-shop-context.tsx',
  'components/storefront/storefront-catalogue.tsx',
  'components/storefront/storefront-product-card.tsx',
  'components/storefront/storefront-product-detail.tsx',
  'components/storefront/storefront-add-to-cart.tsx',
  'components/storefront/storefront-checkout.tsx',
  'components/storefront/storefront-track-form.tsx',
  'components/storefront/storefront-order-card.tsx',
  'components/storefront/storefront-merchandising.tsx',
  'components/storefront/storefront-category-bar.tsx',
  'components/storefront/storefront-header-search.tsx',
  'lib/shop/storefront-layout.ts',
  'lib/shop/storefront-shops.ts',
  'lib/shop/storefront-locale.ts',
  'lib/shop/public-catalogue.ts',
  'lib/shop/public-checkout.ts',
  'lib/shop/public-order.ts',
  'lib/shop/public-order-view.ts',
  'lib/shop/public-merchandising.ts',
]

const FORBIDDEN_IN_STOREFRONT =
  /supabaseAdmin|SERVICE_ROLE|createCommerceSale|costPrice|unitCost|requireShopPortalSession|requireShopPortalAdmin|staff_sessions/

test('storefront shell files exist', () => {
  for (const rel of STOREFRONT_FILES) {
    assert.ok(existsSync(join(root, rel)), `missing ${rel}`)
  }
})

test('proxy matcher includes public storefront routes and keeps staff aliases', () => {
  const proxy = read('proxy.ts')
  assert.match(proxy, /matcher:\s*\[[\s\S]*?'\/users'[\s\S]*?'\/users\/:path\*'/ )
  assert.match(proxy, /'\/cart'/)
  assert.match(proxy, /'\/cart\/:path\*'/ )
  assert.match(proxy, /'\/checkout'/)
  assert.match(proxy, /'\/track'/)
  assert.match(proxy, /'\/product'/)
  assert.match(proxy, /'\/product\/:path\*'/ )
  assert.match(proxy, /'\/order'/)
  assert.match(proxy, /'\/storefront'/)
  assert.match(proxy, /'\/pos'/)
  assert.match(proxy, /'\/products'/)
  assert.match(proxy, /'\/inventory'/)
  assert.match(proxy, /'\/sales'/)
  assert.match(proxy, /'\/settings'/)
  assert.match(proxy, /'\/dashboard'/)
  assert.match(proxy, /'\/login'/)
  assert.match(proxy, /'\/manage'/)
})

test('shop host / rewrites to storefront instead of staff login', () => {
  const proxy = read('proxy.ts')
  assert.match(proxy, /rewriteShopStorefrontPath/)
  assert.match(proxy, /isShopHostStorefrontPath/)
  assert.doesNotMatch(
    proxy,
    /if \(pathname === '\/'\) \{\s*return NextResponse\.redirect\(new URL\(staffCookie \? '\/dashboard' : '\/login'/
  )
  assert.match(
    proxy,
    /pathname === '\/manage' \|\| pathname === '\/manage\/'[\s\S]*staffCookie \? '\/dashboard' : '\/login'/
  )
})

test('hosts keep academy /shop separate from shop-host /product', () => {
  const src = read('lib/shop/hosts.ts')
  assert.match(src, /SHOP_HOST_STOREFRONT_PATH_PREFIXES/)
  assert.match(src, /export function rewriteShopStorefrontPath/)
  assert.match(src, /'\/product'/)
  assert.match(src, /'\/products'/)
  assert.match(src, /isPublicStorefrontPath/)
})

test('public storefront layout is host-gated and unauthenticated', () => {
  const layout = read('app/storefront/layout.tsx')
  assert.match(layout, /ShopI18nProvider/)
  assert.match(layout, /StorefrontShell/)
  assert.match(layout, /isCurrentRequestShopHost/)
  assert.match(layout, /redirect\('\/shop'\)/)
  assert.doesNotMatch(layout, FORBIDDEN_IN_STOREFRONT)
})

test('staff portal layout remains protected', () => {
  const layout = read('app/manage/(portal)/layout.tsx')
  assert.match(layout, /requireShopPortalSession/)
  assert.match(layout, /isCurrentRequestShopHost/)
})

test('public storefront uses a full-width retail shell, not the staff sidebar', () => {
  const shell = read('components/storefront/storefront-shell.tsx')
  assert.match(shell, /StorefrontHeader/)
  assert.match(shell, /flex min-h-screen w-full min-w-0 flex-col/)
  assert.doesNotMatch(shell, /ShopShell/)
  assert.doesNotMatch(shell, /<aside/)
  assert.doesNotMatch(shell, /w-60/)
  assert.doesNotMatch(shell, /max-w-6xl|max-w-7xl/)
  assert.doesNotMatch(shell, /StorefrontShopContext/)

  const header = read('components/storefront/storefront-header.tsx')
  assert.match(header, /STOREFRONT_GUTTER/)
  assert.match(header, /StorefrontHeaderSearch/)
  assert.match(header, /StorefrontShopContext/)
  assert.match(header, /storefront\.nav\.track/)
  assert.match(header, /storefront\.header\.download/)
  assert.match(header, /storefront\.header\.downloadSoon/)
  assert.match(header, /useShopCart/)
  assert.match(header, /itemCount/)
  assert.match(header, /storefront\.header\.cart/)
  assert.doesNotMatch(header, /play\.google|apk|\.apk/i)
  assert.doesNotMatch(header, /STOREFRONT_NAV_ITEMS/)

  const layout = read('lib/shop/storefront-layout.ts')
  assert.match(layout, /STOREFRONT_GUTTER/)
  assert.match(layout, /px-3 sm:px-4 lg:px-6/)
  assert.doesNotMatch(layout, /max-w-6xl/)

  const staff = read('components/shop-portal/shop-shell.tsx')
  assert.match(staff, /aside className="hidden w-60/)
  assert.match(read('app/manage/(portal)/layout.tsx'), /ShopShell/)
})

test('storefront UI never exposes staff-only or implementation details', () => {
  const files = [
    'app/storefront/layout.tsx',
    'app/storefront/page.tsx',
    'components/storefront/storefront-shell.tsx',
    'components/storefront/storefront-header.tsx',
    'components/storefront/storefront-footer.tsx',
    'components/storefront/storefront-home.tsx',
    'components/storefront/storefront-cart-page.tsx',
    'components/storefront/storefront-coming-soon.tsx',
    'components/storefront/storefront-catalogue.tsx',
    'components/storefront/storefront-product-card.tsx',
    'components/storefront/storefront-product-detail.tsx',
    'components/storefront/storefront-add-to-cart.tsx',
    'components/storefront/storefront-checkout.tsx',
    'components/storefront/storefront-track-form.tsx',
    'components/storefront/storefront-order-card.tsx',
    'components/storefront/storefront-merchandising.tsx',
    'components/storefront/storefront-category-bar.tsx',
    'components/storefront/storefront-header-search.tsx',
    'lib/shop/storefront-layout.ts',
    'lib/shop/storefront-shops.ts',
    'lib/shop/public-catalogue.ts',
    'lib/shop/public-order-view.ts',
    'lib/shop/public-merchandising.ts',
  ]
  for (const rel of files) {
    const src = read(rel)
    assert.doesNotMatch(src, FORBIDDEN_IN_STOREFRONT, rel)
    assert.doesNotMatch(src, /from '@\/lib\/supabaseAdmin'/)
    assert.doesNotMatch(src, /from '@\/lib\/shop\/pos-cart'/)
    assert.doesNotMatch(src, /from '@\/lib\/shop\/commerce-checkout'/)
  }
})

test('customer nav uses public URLs, not /storefront or staff /products', () => {
  const nav = read('lib/shop/storefront-shops.ts')
  assert.match(nav, /href: '\/'/)
  assert.match(nav, /href: '\/cart'/)
  assert.match(nav, /href: '\/track'/)
  assert.doesNotMatch(nav, /href: '\/storefront/)
  assert.doesNotMatch(nav, /href: '\/products'/)
  const header = read('components/storefront/storefront-header.tsx')
  assert.match(header, /href="\/login"/)
  assert.match(header, /href="\/track"/)
  assert.match(header, /href="\/cart"/)
  assert.doesNotMatch(header, /href="\/manage"/)
})

test('only Nyanza Shop is available for customer shopping context', () => {
  const src = read('lib/shop/storefront-shops.ts')
  assert.match(src, /SHOP_LOCATION_CODES\.NYANZA/)
  assert.match(src, /name: 'Nyanza Shop'/)
  assert.match(src, /available: true/)
  assert.doesNotMatch(src, /name: 'Kigali Shop'|name: 'Huye Shop'/)
  assert.match(src, /getAvailableStorefrontShops/)
  const home = read('components/storefront/storefront-home.tsx')
  assert.match(home, /brand\.siteLabel/)
  const context = read('components/storefront/storefront-shop-context.tsx')
  assert.match(context, /storefront\.shoppingFrom/)
  assert.match(context, /available\.length <= 1/)
})

test('storefront reuses Shop i18n and English|Kinyarwanda toggle', () => {
  const toggle = read('components/storefront/storefront-language-toggle.tsx')
  assert.match(toggle, /useShopI18n/)
  assert.match(toggle, /SHOP_LOCALE_LABELS/)
  assert.match(toggle, /\|\s*/)
  const header = read('components/storefront/storefront-header.tsx')
  assert.match(header, /StorefrontLanguageToggle/)
  assert.match(header, /useShopT/)
})

test('cart shell does not create a second checkout', () => {
  const cart = read('components/storefront/storefront-cart-page.tsx')
  assert.match(cart, /storefront\.cart\.empty/)
  assert.match(cart, /common\.subtotal/)
  assert.match(cart, /common\.total/)
  assert.match(cart, /disabled/)
  assert.match(cart, /useShopCart/)
  assert.match(cart, /href="\/checkout"/)
  assert.doesNotMatch(cart, /\/api\/shop\/orders|\/api\/staff\/pos\/sales/)
  const page = read('app/storefront/checkout/page.tsx')
  assert.match(page, /StorefrontCheckout/)
  assert.doesNotMatch(page, /StorefrontComingSoon/)
  assert.doesNotMatch(page, /createCommerceSale/)
})

test('public catalogue and product detail routes load real catalogue data', () => {
  const page = read('app/storefront/page.tsx')
  assert.match(page, /loadPublicCatalogue/)
  assert.match(page, /StorefrontCatalogue/)
  const detail = read('app/storefront/product/[slug]/page.tsx')
  assert.match(detail, /getPublicCatalogueItemBySlug/)
  assert.match(detail, /StorefrontProductDetail/)
  assert.doesNotMatch(detail, /StorefrontComingSoon/)
})

test('public catalogue mapper omits cost, staff fields, and UUID ids', () => {
  const src = read('lib/shop/public-catalogue.ts')
  const typeStart = src.indexOf('export type PublicCatalogueItem')
  const typeEnd = src.indexOf('const UUID_RE')
  const typeBlock = src.slice(typeStart, typeEnd)
  assert.match(typeBlock, /slug:/)
  assert.match(typeBlock, /price:/)
  assert.doesNotMatch(typeBlock, /\nid:/)
  assert.doesNotMatch(src, /costPrice|cost_price|unitCost/)
  assert.match(src, /getPublishedProducts/)
  assert.match(src, /isUuidLike\(identifier\)/)
  assert.match(src, /DEFAULT_PUBLIC_LOW_STOCK_THRESHOLD = 5/)
})

test('public product query does not select cost or barcode', () => {
  const src = read('lib/platform/queries.ts')
  assert.match(src, /PUBLIC_PRODUCT_SELECT/)
  const selectStart = src.indexOf('const PUBLIC_PRODUCT_SELECT')
  const selectEnd = src.indexOf('function mapPublishedProductRow')
  const selectBlock = src.slice(selectStart, selectEnd)
  assert.doesNotMatch(selectBlock, /cost_price|costPrice|barcode/)
  assert.doesNotMatch(src, /\.select\('\*, category:categories\(\*\)'\)/)
})

test('availability and out-of-stock cart rules', () => {
  function publicAvailability(stock, threshold = 5) {
    if (stock <= 0) return 'out'
    if (stock <= threshold) return 'few'
    return 'available'
  }
  function canAdd(item) {
    return item.inStock && item.maxQuantity > 0
  }
  assert.equal(publicAvailability(12), 'available')
  assert.equal(publicAvailability(5), 'few')
  assert.equal(publicAvailability(1), 'few')
  assert.equal(publicAvailability(0), 'out')
  assert.equal(canAdd({ inStock: false, maxQuantity: 0 }), false)
  assert.equal(canAdd({ inStock: true, maxQuantity: 4 }), true)
  const addBtn = read('components/storefront/storefront-add-to-cart.tsx')
  assert.match(addBtn, /canAddPublicProductToCart/)
  assert.match(addBtn, /storefront\.catalogue\.unavailable/)
  assert.doesNotMatch(addBtn, /createCommerceSale/)
})

test('catalogue search lives in the header; categories stay in the category bar', () => {
  const catalogue = read('components/storefront/storefront-catalogue.tsx')
  assert.doesNotMatch(catalogue, /searchPlaceholder/)
  assert.doesNotMatch(catalogue, /params\.set\('q'/)
  assert.doesNotMatch(catalogue, /params\.set\('category'/)
  const search = read('components/storefront/storefront-header-search.tsx')
  assert.match(search, /searchPlaceholder/)
  assert.match(search, /action\.search/)
  assert.match(search, /\/\?q=/)
  const bar = read('components/storefront/storefront-category-bar.tsx')
  assert.match(bar, /params\.set\('q'/)
  assert.match(bar, /params\.set\('category'/)
  assert.match(bar, /storefront\.catalogue\.all/)
  const loader = read('lib/shop/public-catalogue.ts')
  assert.match(loader, /item\.sku/)
  assert.match(loader, /item\.categoryName/)
  assert.match(loader, /getCategories\('shop'\)/)
  assert.doesNotMatch(loader, /\/api\/staff\/products|\/api\/shop\/products/)
})

test('staff routes, POS, and createCommerceSale remain untouched by catalogue UI', () => {
  assert.match(read('app/manage/(portal)/layout.tsx'), /requireShopPortalSession/)
  assert.match(read('proxy.ts'), /matcher:\s*\[[\s\S]*?'\/users'[\s\S]*?'\/users\/:path\*'/ )
  const pos = read('components/shop-portal/shop-pos-terminal.tsx')
  assert.match(pos, /createCommerceSale|\/api\/staff\/pos\/sales/)
  const checkout = read('lib/shop/commerce-checkout.ts')
  assert.match(checkout, /export async function createCommerceSale/)
  assert.match(checkout, /allocateCommerceOrderNumber/)
  assert.doesNotMatch(read('components/storefront/storefront-catalogue.tsx'), /createCommerceSale/)
  assert.doesNotMatch(read('lib/shop/public-catalogue.ts'), /createCommerceSale/)
})

test('public checkout route exists and reuses createCommerceSale', () => {
  const page = read('app/storefront/checkout/page.tsx')
  const ui = read('components/storefront/storefront-checkout.tsx')
  const api = read('app/api/shop/orders/route.ts')
  assert.match(page, /StorefrontCheckout/)
  assert.match(ui, /\/api\/shop\/orders/)
  assert.match(ui, /MomoPayCard/)
  assert.match(ui, /\/api\/public\/upload-receipt/)
  assert.doesNotMatch(ui, /createCommerceSale/)
  assert.doesNotMatch(ui, /from '@\/lib\/shop\/public-checkout'/)
  assert.doesNotMatch(ui, /from '@\/lib\/shop\/commerce-checkout'/)
  assert.match(api, /createCommerceSale/)
  assert.match(api, /channel: 'online'/)
  assert.match(api, /resolvePublicCheckoutItems/)
  assert.match(api, /toPublicShopOrderResponse/)
  assert.doesNotMatch(api, /gateway_pending|MTN Collections|Collections API/)
})

test('public identifiers resolve server-side and client figures are not authority', () => {
  const resolve = read('lib/shop/public-checkout.ts')
  assert.match(resolve, /getPublishedProducts/)
  assert.match(resolve, /publicProductSlug/)
  assert.match(resolve, /quotedUnitPriceMatches/)
  assert.match(resolve, /isUuidLike/)
  assert.match(resolve, /canAddPublicProductToCart/)
  assert.doesNotMatch(resolve, /createCommerceSale/)
  const api = read('app/api/shop/orders/route.ts')
  assert.doesNotMatch(api, /body\.locationId|body\.location_id|body\.price|body\.totalAmount|body\.stock/)
  assert.doesNotMatch(api, /item\.price|items\.price/)
  const ui = read('components/storefront/storefront-checkout.tsx')
  assert.match(ui, /slug: item\.productId/)
  assert.match(ui, /quotedUnitPrice: item\.price/)
  assert.doesNotMatch(ui, /locationId|location_id/)
})

test('Nyanza location is server-resolved for online checkout', () => {
  const api = read('app/api/shop/orders/route.ts')
  assert.match(api, /resolveShopPortalPosLocation/)
  assert.match(api, /locationId: portalLocation\?\.id/)
  assert.match(api, /Never trust client-supplied location/)
  assert.match(read('lib/shop/resolve-pos-location.ts'), /SHOP_LOCATION_CODES\.NYANZA/)
  const numbering = read('lib/shop/commerce-checkout.ts')
  assert.match(numbering, /allocateCommerceOrderNumber\(input\.locationId/)
  const ui = read('components/storefront/storefront-checkout.tsx')
  assert.doesNotMatch(ui, /EL-NYZ-|generateOrderNumber|order_number/)
})

test('public checkout response omits order UUID, cost, and stock internals', () => {
  const src = read('lib/shop/public-checkout.ts')
  const fnStart = src.indexOf('export function toPublicShopOrderResponse')
  assert.ok(fnStart >= 0)
  const fn = src.slice(fnStart, src.indexOf('fulfillmentType ===', fnStart) + 400)
  assert.match(fn, /orderNumber:/)
  assert.match(fn, /shopName:/)
  assert.doesNotMatch(fn, /orderId/)
  assert.doesNotMatch(fn, /costPrice|cost_price|unitCost|unit_cost/)
  assert.doesNotMatch(fn, /stockState|stock_state/)
  assert.doesNotMatch(fn, /receipt:/)
  const api = read('app/api/shop/orders/route.ts')
  assert.doesNotMatch(api, /orderId: result\.orderId/)
  assert.doesNotMatch(api, /stockState: result\.stockState/)
  assert.doesNotMatch(api, /receipt: result\.receipt/)
})

test('quoted price is compared not charged, and UUID slugs are rejected', () => {
  function quotedUnitPriceMatches(quoted, serverPrice) {
    if (quoted == null || quoted === '') return true
    const n = Number(quoted)
    if (!Number.isFinite(n)) return false
    return Math.round(n) === Math.round(serverPrice)
  }
  assert.equal(quotedUnitPriceMatches(undefined, 1000), true)
  assert.equal(quotedUnitPriceMatches(1000, 1000), true)
  assert.equal(quotedUnitPriceMatches(999, 1000), false)
  assert.equal(quotedUnitPriceMatches('nope', 1000), false)
  const resolve = read('lib/shop/public-checkout.ts')
  assert.match(resolve, /quotedUnitPriceMatches\(row\.quotedUnitPrice, publicItem\.price\)/)
  assert.match(resolve, /isUuidLike\(slug\)/)
  assert.match(resolve, /items\.push\(\{ productId: product\.id, quantity \}\)/)
})

test('MoMo checkout reuses the existing card and receipt upload', () => {
  const ui = read('components/storefront/storefront-checkout.tsx')
  assert.match(ui, /from '@\/components\/payment\/momo-pay-card'/)
  assert.match(ui, /\/api\/public\/upload-receipt/)
  assert.doesNotMatch(ui, /gateway_pending|webhook|Collections/)
  const momo = read('components/payment/momo-pay-card.tsx')
  assert.match(momo, /PAYMENT\.momoPayCode/)
  const upload = read('app/api/public/upload-receipt/route.ts')
  assert.match(upload, /uploadObject/)
})

test('successful confirmation uses required English and Kinyarwanda wording', () => {
  const ui = read('components/storefront/storefront-checkout.tsx')
  assert.match(ui, /storefront\.checkout\.successTitle/)
  assert.match(ui, /storefront\.checkout\.thankYou/)
  assert.match(ui, /storefront\.checkout\.keepNumber/)
  assert.match(ui, /storefront\.nav\.track/)
  assert.match(ui, /\/order\/\$\{encodeURIComponent\(orderNumber\)\}/)
  const en = read('lib/shop/i18n/messages/en.ts')
  const rw = read('lib/shop/i18n/messages/rw.ts')
  assert.match(en, /'storefront\.checkout\.successTitle': 'Order placed successfully'/)
  assert.match(en, /'storefront\.checkout\.thankYou': 'Thank you for shopping with Energy & Logics\.'/)
  assert.match(en, /'storefront\.checkout\.keepNumber': 'Keep this number to track your order\.'/)
  assert.match(rw, /'storefront\.checkout\.successTitle': 'Ibyatumijwe byakiriwe neza'/)
  assert.match(rw, /'storefront\.checkout\.thankYou': 'Murakoze guhahira muri Energy & Logics\.'/)
  assert.match(rw, /'storefront\.checkout\.keepNumber': 'Ukoreshe iyi nimero ukurikirana ibyo watumije\.'/)
})

test('public /track and /order/[ref] reuse lookupOrder by order_number', () => {
  const track = read('app/storefront/track/page.tsx')
  const orderPage = read('app/storefront/order/[ref]/page.tsx')
  const lookup = read('lib/shop/public-order.ts')
  const view = read('lib/shop/public-order-view.ts')
  assert.match(track, /getPublicOrder/)
  assert.match(track, /StorefrontTrackForm/)
  assert.doesNotMatch(track, /StorefrontComingSoon/)
  assert.match(orderPage, /getPublicOrder/)
  assert.match(orderPage, /StorefrontOrderCard/)
  assert.doesNotMatch(orderPage, /StorefrontComingSoon/)
  assert.match(lookup, /lookupOrder/)
  assert.match(lookup, /toPublicOrderView/)
  assert.match(read('lib/shop/order-lookup.ts'), /\.eq\('order_number', orderNumber\)/)
  assert.match(read('lib/shop/order-lookup.ts'), /export function normalizeOrderCode/)
  assert.doesNotMatch(lookup, /createCommerceSale/)
  assert.doesNotMatch(view, /supabaseAdmin|SERVICE_ROLE/)
})

test('public tracking accepts unified and historical order numbers, not UUIDs', () => {
  function normalizeTrackCode(raw) {
    try {
      return decodeURIComponent(raw).trim().toUpperCase()
    } catch {
      return raw.trim().toUpperCase()
    }
  }
  function isUuidLike(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      String(value).trim()
    )
  }
  function isPublicTrackableOrderNumber(raw) {
    const code = normalizeTrackCode(raw)
    if (!code) return false
    if (isUuidLike(code)) return false
    return true
  }
  assert.equal(isPublicTrackableOrderNumber('EL-NYZ-20260827-0001'), true)
  assert.equal(isPublicTrackableOrderNumber('el-nyz-20260827-0001'), true)
  assert.equal(isPublicTrackableOrderNumber('POS-M5K8X2-AB3F'), true)
  assert.equal(isPublicTrackableOrderNumber('EL-M5K8X2-XY9Z'), true)
  assert.equal(isPublicTrackableOrderNumber(''), false)
  assert.equal(isPublicTrackableOrderNumber('3fa85f64-5717-4562-b3fc-2c963f66afa6'), false)
  const view = read('lib/shop/public-order-view.ts')
  assert.match(view, /isUuidLike\(code\)/)
  assert.match(read('lib/shop/public-order.ts'), /isPublicTrackableOrderNumber/)
})

test('unknown order numbers produce a safe not-found and omit internals', () => {
  const track = read('app/storefront/track/page.tsx')
  const missing = read('components/storefront/storefront-order-card.tsx')
  assert.match(track, /StorefrontTrackNotFound/)
  assert.match(missing, /storefront\.track\.notFound/)
  assert.match(missing, /href="\/track"/)
  const view = read('lib/shop/public-order-view.ts')
  const typeStart = view.indexOf('export type PublicOrderView')
  const typeEnd = view.indexOf('export type PublicOrderLookupSource')
  const typeBlock = view.slice(typeStart, typeEnd)
  assert.match(typeBlock, /orderNumber:/)
  assert.match(typeBlock, /shopName:/)
  assert.doesNotMatch(typeBlock, /\nid:/)
  assert.doesNotMatch(typeBlock, /orderId|productId|costPrice|unitCost|customerPhone|createdBy|stockState/)
  assert.doesNotMatch(view, /cost_price|unit_cost|receipt_url/)
  const lookup = read('lib/shop/public-order.ts')
  assert.doesNotMatch(lookup, /customerName|customerPhone|order\.id|product_id/)
  const card = read('components/storefront/storefront-order-card.tsx')
  assert.doesNotMatch(card, /pending_review|gateway_pending|stock_state|unitCost/)
  assert.doesNotMatch(card, /createCommerceSale|supabaseAdmin/)
})

test('internal payment codes map to customer-facing labels', () => {
  function mapPublicOrderStatus(orderStatus, paymentStatus) {
    const order = String(orderStatus || '').trim().toLowerCase()
    const pay = String(paymentStatus || '').trim().toLowerCase()
    if (order === 'cancelled' || order === 'canceled') return 'cancelled'
    if (order === 'completed') return 'completed'
    if (order === 'ready' || order === 'ready_for_pickup') return 'ready'
    if (order === 'preparing' || order === 'processing') return 'preparing'
    if (pay === 'paid' || pay === 'approved') return 'payment_confirmed'
    if (pay === 'pending_review' || pay === 'pending' || pay === 'gateway_pending') {
      return 'payment_awaiting'
    }
    if (order === 'confirmed') return 'payment_confirmed'
    return 'received'
  }
  function mapPublicPaymentStatus(paymentStatus) {
    const pay = String(paymentStatus || '').trim().toLowerCase()
    if (pay === 'paid' || pay === 'approved') return 'confirmed'
    if (pay === 'rejected' || pay === 'failed' || pay === 'unpaid') return 'not_completed'
    return 'awaiting'
  }
  assert.equal(mapPublicOrderStatus('pending', 'pending_review'), 'payment_awaiting')
  assert.equal(mapPublicOrderStatus('confirmed', 'paid'), 'payment_confirmed')
  assert.equal(mapPublicOrderStatus('cancelled', 'pending_review'), 'cancelled')
  assert.equal(mapPublicPaymentStatus('pending_review'), 'awaiting')
  assert.equal(mapPublicPaymentStatus('paid'), 'confirmed')
  assert.equal(mapPublicPaymentStatus('rejected'), 'not_completed')
  const card = read('components/storefront/storefront-order-card.tsx')
  assert.match(card, /storefront\.status\.paymentAwaiting/)
  assert.match(card, /storefront\.payment\.momo/)
  assert.doesNotMatch(card, /pending_review/)
})

test('existing receipt lookup route remains on lookupOrder', () => {
  const page = read('app/receipt/[code]/page.tsx')
  assert.match(page, /lookupOrder/)
  assert.match(page, /Order found/)
  assert.doesNotMatch(page, /getPublicOrder/)
  assert.match(read('lib/shop/order-lookup.ts'), /getOrderReceiptUrl/)
})

test('selling unit migration adds product columns without inventory or EBM', () => {
  const src = read('lib/shop/public-catalogue.ts')
  assert.doesNotMatch(src, /ALTER TABLE|CREATE TABLE|product_location_stock/)
  assert.doesNotMatch(read('lib/shop/public-checkout.ts'), /ALTER TABLE|CREATE TABLE|product_location_stock/)
  assert.doesNotMatch(read('lib/shop/public-order.ts'), /ALTER TABLE|CREATE TABLE|product_location_stock/)
  assert.doesNotMatch(read('lib/shop/public-merchandising.ts'), /ALTER TABLE|CREATE TABLE|product_location_stock/)
  const sqlFiles = readdirSync(join(root, 'scripts')).filter((name) => name.endsWith('.sql'))
  assert.ok(sqlFiles.includes('90-shop-product-selling-unit.sql'))
  assert.equal(
    sqlFiles.some((name) => /public-catalogue|product_location_stock|products\.slug|products\.is_featured/i.test(name)),
    false
  )
  const sql = read('scripts/90-shop-product-selling-unit.sql')
  const sqlBody = sql.replace(/--[^\n]*/g, '')
  assert.match(sql, /selling_quantity NUMERIC\(12,3\) NOT NULL DEFAULT 1/)
  assert.match(sql, /selling_unit TEXT NOT NULL DEFAULT 'PCS'/)
  assert.match(sql, /CHECK \(selling_quantity > 0\)/)
  assert.match(sql, /'PCS', 'PACK', 'SET', 'PAIR', 'M', 'CM', 'MM', 'KG', 'G', 'L', 'ML'/)
  assert.match(sql, /SET selling_quantity = 1/)
  assert.match(sql, /SET selling_unit = 'PCS'/)
  assert.doesNotMatch(sqlBody, /CREATE TABLE|ALTER TABLE order_items|product_location_stock|sale_number/)
  assert.doesNotMatch(sqlBody, /UPDATE orders/)
})

function sampleItem(overrides = {}) {
  return {
    slug: 'item',
    name: 'Item',
    description: null,
    image: '/img.jpg',
    price: 1000,
    listPrice: null,
    discountAmount: null,
    sellingUnitLabel: null,
    categoryName: 'Audio',
    categorySlug: 'audio',
    sku: 'SKU',
    availability: 'available',
    inStock: true,
    maxQuantity: 4,
    specifications: {},
    ...overrides,
  }
}

function uniqueBySlug(items, limit, seen) {
  const selected = []
  for (const item of items) {
    if (selected.length >= limit) break
    const slug = item.slug.trim()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    selected.push(item)
  }
  return selected
}

function selectHeroProducts(products, limit = 5) {
  const cap = Math.max(1, Math.min(5, limit))
  const seen = new Set()
  const inStockWithImage = products.filter((item) => item.inStock && Boolean(item.image))
  const selected = uniqueBySlug(inStockWithImage, cap, seen)
  if (selected.length < 3) {
    const withImage = products.filter((item) => Boolean(item.image))
    selected.push(...uniqueBySlug(withImage, cap - selected.length, seen))
  }
  return selected
}

function selectDealProducts(products, limit = 8) {
  return products
    .filter(
      (item) =>
        (item.discountAmount ?? 0) > 0 &&
        item.listPrice != null &&
        item.listPrice > item.price
    )
    .slice(0, Math.max(0, limit))
}

function selectLatestProducts(products, heroProducts, limit = 8) {
  const heroSlugs = new Set(heroProducts.map((item) => item.slug))
  const rest = uniqueBySlug(
    products.filter((item) => !heroSlugs.has(item.slug)),
    Math.max(0, limit),
    new Set()
  )
  if (rest.length > 0) return rest
  if (products.length === 1) return uniqueBySlug(products, 1, new Set())
  return []
}

function recencyBoost(catalogueIndex) {
  if (catalogueIndex < 0) return 0
  if (catalogueIndex < 4) return 3
  if (catalogueIndex < 8) return 2
  if (catalogueIndex < 16) return 1
  return 0
}

function trendScore(item, catalogueIndex) {
  let score = 0
  if (item.inStock) score += 4
  if (item.image) score += 4
  if (
    (item.discountAmount ?? 0) > 0 &&
    item.listPrice != null &&
    item.listPrice > item.price
  ) {
    score += 3
  }
  score += recencyBoost(catalogueIndex)
  return score
}

function selectTrendProducts(products, excluded, limit = 4) {
  const skip = new Set(excluded.map((item) => item.slug))
  const indexBySlug = new Map(products.map((item, index) => [item.slug, index]))
  const pool = products.filter(
    (item) => !skip.has(item.slug) && item.inStock && Boolean(item.image)
  )
  if (pool.length === 0) return []
  const ranked = [...pool].sort((a, b) => {
    const scoreA = trendScore(a, indexBySlug.get(a.slug) ?? 999)
    const scoreB = trendScore(b, indexBySlug.get(b.slug) ?? 999)
    if (scoreB !== scoreA) return scoreB - scoreA
    return (indexBySlug.get(a.slug) ?? 0) - (indexBySlug.get(b.slug) ?? 0)
  })
  const selected = []
  const seen = new Set()
  const seenCats = new Set()
  const take = (requireNewCategory) => {
    for (const item of ranked) {
      if (selected.length >= limit) break
      if (seen.has(item.slug)) continue
      const category = item.categorySlug?.trim() ?? ''
      if (requireNewCategory && category && seenCats.has(category)) continue
      seen.add(item.slug)
      if (category) seenCats.add(category)
      selected.push(item)
    }
  }
  take(true)
  take(false)
  return selected
}

function formatSellingQuantity(quantity) {
  const n = Number(quantity)
  if (!Number.isFinite(n)) return '1'
  const rounded = Math.round(n * 1000) / 1000
  if (Number.isInteger(rounded)) return String(rounded)
  return rounded.toFixed(3).replace(/\.?0+$/, '')
}

function formatSellingUnit(quantity, unit) {
  return `${formatSellingQuantity(quantity)} ${unit}`
}

test('new arrivals take the newest published catalogue products', () => {
  const queries = read('lib/platform/queries.ts')
  assert.match(queries, /export async function getPublishedProducts/)
  assert.match(queries, /\.order\('created_at', \{ ascending: false \}\)/)
  const merch = read('lib/shop/public-merchandising.ts')
  assert.match(merch, /export function selectNewArrivals/)
  assert.match(merch, /products\.slice\(0/)
  assert.match(merch, /NEW_ARRIVALS_LIMIT = 8/)
  assert.match(read('app/storefront/page.tsx'), /buildStorefrontMerchandising\(result\.products, result\.categories\)/)
  assert.match(read('components/storefront/storefront-home.tsx'), /storefront\.arrivals\.title/)
  assert.doesNotMatch(read('components/storefront/storefront-merchandising.tsx'), /storefront\.arrivals\.title/)
  const products = [
    sampleItem({ slug: 'newest' }),
    sampleItem({ slug: 'older' }),
    sampleItem({ slug: 'oldest' }),
  ]
  assert.deepEqual(
    products.slice(0, 8).map((item) => item.slug),
    ['newest', 'older', 'oldest']
  )
})

test('hero selects 3-5 unique in-stock products with images when available', () => {
  const merch = read('lib/shop/public-merchandising.ts')
  assert.match(merch, /export function selectHeroProducts/)
  assert.match(merch, /HERO_LIMIT = 5/)
  assert.doesNotMatch(merch, /is_featured/)
  assert.doesNotMatch(
    merch,
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  )
  const products = [
    sampleItem({ slug: 'uno', inStock: true, image: '/uno.jpg' }),
    sampleItem({ slug: 'uno', inStock: true, image: '/uno.jpg' }),
    sampleItem({ slug: 'cable', inStock: true, image: '/cable.jpg' }),
    sampleItem({ slug: 'speaker', inStock: true, image: '/speaker.jpg' }),
    sampleItem({ slug: 'ghost', inStock: true, image: null }),
    sampleItem({ slug: 'old', inStock: false, image: '/old.jpg' }),
  ]
  const selected = selectHeroProducts(products)
  assert.deepEqual(
    selected.map((item) => item.slug),
    ['uno', 'cable', 'speaker']
  )
  assert.equal(new Set(selected.map((item) => item.slug)).size, selected.length)
  assert.ok(selected.length >= 1 && selected.length <= 5)
  assert.deepEqual(
    selectHeroProducts([
      sampleItem({ slug: 'uno', inStock: true, image: '/uno.jpg' }),
      sampleItem({ slug: 'old', inStock: false, image: '/old.jpg' }),
    ]).map((item) => item.slug),
    ['uno', 'old']
  )
  assert.equal(selectHeroProducts([sampleItem({ slug: 'only', image: '/a.jpg' })]).length, 1)
})

test('featured products are derived without an is_featured column', () => {
  const productType = read('types/platform.ts')
  const typeStart = productType.indexOf('export interface Product')
  const typeEnd = productType.indexOf('export interface SupportTicket')
  const typeBlock = productType.slice(typeStart, typeEnd)
  assert.doesNotMatch(typeBlock, /is_featured/)
  assert.doesNotMatch(read('lib/platform/queries.ts').slice(
    read('lib/platform/queries.ts').indexOf('const PUBLIC_PRODUCT_SELECT'),
    read('lib/platform/queries.ts').indexOf('function mapPublishedProductRow')
  ), /is_featured/)
  const merch = read('lib/shop/public-merchandising.ts')
  assert.match(merch, /export function selectFeaturedProducts/)
  assert.doesNotMatch(merch, /is_featured/)
})

test('latest products are independent of the New Arrivals hero', () => {
  const merch = read('lib/shop/public-merchandising.ts')
  const ui = read('components/storefront/storefront-merchandising.tsx')
  assert.match(merch, /export function selectLatestProducts/)
  assert.match(merch, /LATEST_LIMIT = 8/)
  assert.match(ui, /storefront\.latest\.title/)
  assert.match(ui, /merch\.latestProducts/)
  assert.doesNotMatch(ui, /merch\.newArrivals/)
  assert.doesNotMatch(ui, /merch\.heroProducts/)

  const catalogue = [
    sampleItem({ slug: 'a', inStock: true, image: '/a.jpg' }),
    sampleItem({ slug: 'b', inStock: true, image: '/b.jpg' }),
    sampleItem({ slug: 'c', inStock: true, image: '/c.jpg' }),
    sampleItem({ slug: 'd', inStock: true, image: '/d.jpg' }),
    sampleItem({ slug: 'e', inStock: true, image: '/e.jpg' }),
    sampleItem({ slug: 'latest-only', inStock: true, image: '/f.jpg' }),
  ]
  const hero = selectHeroProducts(catalogue)
  const latest = selectLatestProducts(catalogue, hero)
  assert.deepEqual(
    hero.map((item) => item.slug),
    ['a', 'b', 'c', 'd', 'e']
  )
  assert.ok(latest.every((item) => !hero.some((slide) => slide.slug === item.slug)))
  assert.deepEqual(
    latest.map((item) => item.slug),
    ['latest-only']
  )

  const tiny = [sampleItem({ slug: 'arduino', inStock: true, image: '/a.jpg' })]
  const tinyHero = selectHeroProducts(tiny)
  assert.deepEqual(
    selectLatestProducts(tiny, tinyHero).map((item) => item.slug),
    ['arduino']
  )

  const three = [
    sampleItem({ slug: 'a', inStock: true, image: '/a.jpg' }),
    sampleItem({ slug: 'b', inStock: true, image: '/b.jpg' }),
    sampleItem({ slug: 'c', inStock: true, image: '/c.jpg' }),
  ]
  assert.deepEqual(selectLatestProducts(three, selectHeroProducts(three)), [])
})

test('trends are derived without analytics or unsupported popularity claims', () => {
  const merch = read('lib/shop/public-merchandising.ts')
  const ui = read('components/storefront/storefront-merchandising.tsx')
  const en = read('lib/shop/i18n/messages/en.ts')
  const rw = read('lib/shop/i18n/messages/rw.ts')
  assert.match(merch, /export function selectTrendProducts/)
  assert.match(merch, /export function trendScore/)
  assert.match(merch, /TRENDS_LIMIT = 4/)
  assert.match(merch, /not purchase or view analytics/i)
  assert.match(ui, /storefront\.trends\.title/)
  assert.doesNotMatch(en, /Best Sellers|Most Popular|Most Purchased|Most Viewed/)
  assert.doesNotMatch(rw, /Best Sellers|Most Popular|Most Purchased/)
  assert.doesNotMatch(ui, /Best Sellers|Most Popular|Most Purchased/)
  assert.doesNotMatch(merch, /is_trending/)

  const excluded = [
    sampleItem({ slug: 'hero-a', categorySlug: 'audio', inStock: true, image: '/a.jpg' }),
    sampleItem({ slug: 'latest-d', categorySlug: 'cables', inStock: true, image: '/d.jpg' }),
  ]
  const catalogue = [
    ...excluded,
    sampleItem({
      slug: 'trend-sale',
      categorySlug: 'batteries',
      inStock: true,
      image: '/e.jpg',
      price: 8000,
      listPrice: 10000,
      discountAmount: 2000,
    }),
    sampleItem({ slug: 'trend-f', categorySlug: 'phones', inStock: true, image: '/f.jpg' }),
    sampleItem({ slug: 'ghost', categorySlug: 'audio', inStock: true, image: null }),
  ]
  const trends = selectTrendProducts(catalogue, excluded)
  const used = new Set(excluded.map((item) => item.slug))
  assert.ok(trends.length > 0)
  assert.ok(trends.every((item) => !used.has(item.slug)))
  assert.ok(trends.every((item) => item.inStock && item.image))
  assert.ok(trends.some((item) => item.slug === 'trend-sale'))
  assert.equal(selectTrendProducts(catalogue, catalogue).length, 0)
})

test('promos and category tiles use database slugs, not hard-coded IDs', () => {
  const merch = read('lib/shop/public-merchandising.ts')
  assert.match(merch, /category\.slug/)
  assert.match(merch, /SOUND_RE/)
  assert.match(merch, /POWER_RE/)
  assert.doesNotMatch(merch, /category_id|categoryId/)
  assert.doesNotMatch(
    merch,
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  )
  const ui = read('components/storefront/storefront-merchandising.tsx')
  assert.match(ui, /\/\?category=\$\{encodeURIComponent\(category\.slug\)\}/)
  assert.match(ui, /\/\?category=\$\{encodeURIComponent\(promo\.categorySlug\)\}/)
  assert.match(ui, /storefront\.promo\.sound\.title/)
  assert.match(ui, /storefront\.promo\.power\.title/)
  assert.match(ui, /storefront\.categories\.title/)
  const bar = read('components/storefront/storefront-category-bar.tsx')
  assert.match(bar, /category\.slug/)
  assert.doesNotMatch(bar, /category_id|categoryId/)
})

test('homepage merchandising is hidden when search or category filters are active', () => {
  const page = read('app/storefront/page.tsx')
  assert.match(page, /const filtered = Boolean\(categorySlug \|\| search\)/)
  assert.match(page, /filtered \? null : buildStorefrontMerchandising/)
  assert.match(page, /\{merch \?/)
  assert.match(page, /StorefrontHome slides=\{merch\.heroProducts\}/)
  assert.match(page, /StorefrontCategoryBar/)
})

test('marketplace sections stay distinct and do not duplicate chrome', () => {
  const catalogue = read('components/storefront/storefront-catalogue.tsx')
  const header = read('components/storefront/storefront-header.tsx')
  const home = read('components/storefront/storefront-home.tsx')
  const shell = read('components/storefront/storefront-shell.tsx')
  const merchUi = read('components/storefront/storefront-merchandising.tsx')
  const bar = read('components/storefront/storefront-category-bar.tsx')
  assert.match(header, /StorefrontHeaderSearch/)
  assert.match(header, /md:hidden/)
  assert.doesNotMatch(catalogue, /StorefrontHeaderSearch/)
  assert.doesNotMatch(catalogue, /searchPlaceholder/)
  assert.doesNotMatch(home, /storefront\.shoppingFrom/)
  assert.doesNotMatch(shell, /storefront\.shoppingFrom/)
  assert.doesNotMatch(shell, /ShopShell|<aside|w-60/)
  assert.match(merchUi, /bg-amber-50/)
  assert.match(merchUi, /storefront\.latest\.title/)
  assert.match(merchUi, /storefront\.trends\.title/)
  assert.match(merchUi, /lg:grid-cols-\[1\.15fr_0\.85fr\]/)
  assert.doesNotMatch(merchUi, /merch\.newArrivals/)
  assert.match(bar, /overflow-x-auto/)
  assert.match(bar, /max-w-full/)
  assert.match(read('app/manage/(portal)/layout.tsx'), /ShopShell/)
})

test('product grid uses a denser 2-6 column layout with square images', () => {
  const catalogue = read('components/storefront/storefront-catalogue.tsx')
  const merchUi = read('components/storefront/storefront-merchandising.tsx')
  const card = read('components/storefront/storefront-product-card.tsx')
  assert.match(catalogue, /grid-cols-2/)
  assert.match(catalogue, /md:grid-cols-3/)
  assert.match(catalogue, /lg:grid-cols-4/)
  assert.match(catalogue, /xl:grid-cols-5/)
  assert.match(catalogue, /2xl:grid-cols-6/)
  assert.match(merchUi, /xl:grid-cols-5/)
  assert.match(card, /aspect-square/)
  assert.match(card, /mt-auto/)
  assert.match(card, /line-clamp-2/)
})

test('storefront merchandising stays product-focused and does not market company services', () => {
  const files = [
    'components/storefront/storefront-home.tsx',
    'components/storefront/storefront-merchandising.tsx',
    'components/storefront/storefront-catalogue.tsx',
    'components/storefront/storefront-category-bar.tsx',
    'lib/shop/public-merchandising.ts',
    'lib/shop/i18n/messages/en.ts',
    'lib/shop/i18n/messages/rw.ts',
  ]
  const SERVICE_MARKETING =
    /Engineering Hub|technical training|\bAcademy\b|internship program|getPublishedServices|engineering services/i
  for (const rel of files) {
    const src = read(rel)
    assert.doesNotMatch(src, SERVICE_MARKETING, rel)
    assert.doesNotMatch(src, /unsplash\.com|picsum\.photos|loremflickr/i, rel)
  }
  const merch = read('lib/shop/public-merchandising.ts')
  assert.doesNotMatch(merch, /costPrice|cost_price|unitCost|staff/)
  assert.match(merch, /PublicCatalogueItem/)
})

test('hero is a full-bleed carousel of real catalogue products', () => {
  const home = read('components/storefront/storefront-home.tsx')
  assert.match(home, /product\.name/)
  assert.match(home, /product\.price/)
  assert.match(home, /product\.image/)
  assert.match(home, /product\.slug/)
  assert.match(home, /from '@\/components\/ui\/carousel'/)
  assert.match(home, /scale-125/)
  assert.match(home, /object-cover/)
  assert.match(home, /sizes="100vw"/)
  assert.match(home, /prefers-reduced-motion/)
  assert.match(home, /storefront\.hero\.previous/)
  assert.match(home, /storefront\.hero\.next/)
  assert.doesNotMatch(home, /max-w-6xl lg:grid-cols-2/)
  assert.doesNotMatch(home, /storefront\.catalogue\.addToCart/)
  assert.doesNotMatch(home, /createCommerceSale/)
  assert.doesNotMatch(read('lib/shop/public-merchandising.ts'), /createCommerceSale/)
})

test('today deals require a real product discount and never invent markdown', () => {
  const merch = read('lib/shop/public-merchandising.ts')
  assert.match(merch, /export function selectDealProducts/)
  assert.match(merch, /discountAmount/)
  assert.match(read('components/storefront/storefront-merchandising.tsx'), /storefront\.deals\.title/)
  const withSale = [
    sampleItem({ slug: 'sale', price: 13000, listPrice: 18000, discountAmount: 5000 }),
    sampleItem({ slug: 'plain', price: 13000, listPrice: null, discountAmount: null }),
    sampleItem({ slug: 'fake', price: 13000, listPrice: 13000, discountAmount: 0 }),
  ]
  assert.deepEqual(
    selectDealProducts(withSale).map((item) => item.slug),
    ['sale']
  )
  assert.deepEqual(selectDealProducts([sampleItem({ slug: 'none' })]), [])
})

test('selling unit comes from database columns and formats without multiplication', () => {
  const helper = read('lib/shop/selling-unit.ts')
  assert.match(helper, /export function formatSellingUnit/)
  assert.match(helper, /PCS.*PACK.*SET.*PAIR.*M.*CM.*MM.*KG.*G.*L.*ML/s)
  assert.doesNotMatch(helper, /specifications/)
  assert.equal(formatSellingUnit(1, 'PCS'), '1 PCS')
  assert.equal(formatSellingUnit(5, 'M'), '5 M')
  assert.equal(formatSellingUnit(20, 'ML'), '20 ML')
  assert.equal(formatSellingUnit(0.5, 'KG'), '0.5 KG')
  assert.equal(formatSellingUnit(1.250, 'L'), '1.25 L')
  assert.doesNotMatch(formatSellingUnit(20, 'ML'), /×/)

  const src = read('lib/shop/public-catalogue.ts')
  assert.doesNotMatch(src, /export function publicSellingUnitLabel/)
  assert.match(src, /formatSellingUnit/)
  assert.match(src, /resolveSellingUnitFields/)
  const typeStart = src.indexOf('export type PublicCatalogueItem')
  const typeEnd = src.indexOf('const UUID_RE')
  const typeBlock = src.slice(typeStart, typeEnd)
  assert.match(typeBlock, /sellingQuantity:/)
  assert.match(typeBlock, /sellingUnit:/)
  assert.match(typeBlock, /sellingUnitLabel:/)
  assert.match(typeBlock, /listPrice:/)
  assert.doesNotMatch(typeBlock, /\nid:/)
  assert.doesNotMatch(typeBlock, /costPrice/)

  const queries = read('lib/platform/queries.ts')
  const selectStart = queries.indexOf('const PUBLIC_PRODUCT_SELECT')
  const selectEnd = queries.indexOf('const PUBLIC_PRODUCT_SELECT_LEGACY')
  const selectBlock = queries.slice(selectStart, selectEnd)
  assert.match(selectBlock, /selling_quantity/)
  assert.match(selectBlock, /selling_unit/)
  assert.doesNotMatch(selectBlock, /cost_price|barcode/)

  const card = read('components/storefront/storefront-product-card.tsx')
  assert.match(card, /product\.sellingUnitLabel/)
  assert.doesNotMatch(card, /×/)
  const detail = read('components/storefront/storefront-product-detail.tsx')
  assert.match(detail, /product\.sellingUnitLabel/)
  assert.doesNotMatch(detail, /5 × M|20 × ML/)
  const cart = read('components/storefront/storefront-cart-page.tsx')
  assert.match(cart, /storefront\.line\.unitQty/)
  const checkout = read('components/storefront/storefront-checkout.tsx')
  assert.match(checkout, /storefront\.line\.unitQty/)
  assert.doesNotMatch(checkout, /sellingUnit:|selling_unit:/)
  const orderCard = read('components/storefront/storefront-order-card.tsx')
  assert.match(orderCard, /item\.sellingUnitLabel/)
  const lookup = read('lib/shop/order-lookup.ts')
  assert.match(lookup, /selling_quantity, selling_unit/)
  assert.doesNotMatch(lookup, /ALTER TABLE order_items|selling_unit TEXT/)
})

test('public checkout ignores client selling unit and price as authority', () => {
  const resolve = read('lib/shop/public-checkout.ts')
  assert.doesNotMatch(resolve, /sellingUnit|selling_unit|sellingQuantity/)
  assert.match(resolve, /quotedUnitPriceMatches\(row\.quotedUnitPrice, publicItem\.price\)/)
  assert.match(resolve, /items\.push\(\{ productId: product\.id, quantity \}\)/)
  const checkout = read('components/storefront/storefront-checkout.tsx')
  assert.match(checkout, /slug: item\.productId/)
  assert.match(checkout, /quantity: item\.quantity/)
  assert.doesNotMatch(checkout, /sellingUnit: item|sellingQuantity: item/)
  const helper = read('lib/shop/selling-unit.ts')
  assert.match(helper, /parseSellingQuantity/)
  assert.match(helper, /n <= 0/)
  assert.match(helper, /isSellingUnit/)
})

function parseSellingQuantity(raw) {
  if (raw === undefined || raw === null || raw === '') return { ok: false }
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim())
  if (!Number.isFinite(n) || n <= 0) return { ok: false }
  const value = Math.round(n * 1000) / 1000
  if (!(value > 0)) return { ok: false }
  return { ok: true, value }
}

function parseSellingUnit(raw) {
  const allowed = ['PCS', 'PACK', 'SET', 'PAIR', 'M', 'CM', 'MM', 'KG', 'G', 'L', 'ML']
  if (raw === undefined || raw === null) return { ok: false }
  const unit = String(raw).trim().toUpperCase()
  if (!allowed.includes(unit)) return { ok: false }
  return { ok: true, value: unit }
}

test('selling quantity and unit validation rejects invalid writes', () => {
  assert.equal(parseSellingQuantity(1).ok, true)
  assert.equal(parseSellingQuantity(0.5).ok, true)
  assert.equal(parseSellingQuantity(0).ok, false)
  assert.equal(parseSellingQuantity(-1).ok, false)
  assert.equal(parseSellingQuantity('nope').ok, false)
  assert.equal(parseSellingUnit('PCS').ok, true)
  assert.equal(parseSellingUnit('ml').ok, true)
  assert.equal(parseSellingUnit('BOX').ok, false)
  assert.equal(parseSellingUnit('metre').ok, false)
  const helper = read('lib/shop/selling-unit.ts')
  assert.match(helper, /parseSellingQuantity/)
  assert.match(helper, /parseSellingUnit/)
  assert.match(helper, /n <= 0/)
  const adminUi = read('components/admin/product-management.tsx')
  assert.match(adminUi, /SELLING_UNITS\.map/)
  assert.match(adminUi, /SelectItem key=\{unit\}/)
})

test('package.json exposes test:shop-storefront', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.scripts['test:shop-storefront'], 'node --test scripts/shop-storefront-selfcheck.mjs')
})
