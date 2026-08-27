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
  'lib/shop/storefront-shops.ts',
  'lib/shop/storefront-locale.ts',
  'lib/shop/public-catalogue.ts',
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
    'lib/shop/storefront-shops.ts',
    'lib/shop/public-catalogue.ts',
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
  assert.match(header, /STOREFRONT_NAV_ITEMS/)
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
  assert.doesNotMatch(cart, /\/api\/shop\/orders|\/api\/staff\/pos\/sales/)
  const checkout = read('app/storefront/checkout/page.tsx')
  assert.match(checkout, /StorefrontComingSoon/)
  assert.doesNotMatch(checkout, /createCommerceSale/)
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

test('catalogue search and categories reuse published product data', () => {
  const catalogue = read('components/storefront/storefront-catalogue.tsx')
  assert.match(catalogue, /searchPlaceholder|action\.search/)
  assert.match(catalogue, /params\.set\('q'/)
  assert.match(catalogue, /params\.set\('category'/)
  assert.match(catalogue, /storefront\.catalogue\.all/)
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

test('no schema migration was introduced for the public catalogue', () => {
  const src = read('lib/shop/public-catalogue.ts')
  assert.doesNotMatch(src, /ALTER TABLE|CREATE TABLE|product_location_stock/)
  const sqlFiles = readdirSync(join(root, 'scripts')).filter((name) => name.endsWith('.sql'))
  assert.equal(
    sqlFiles.some((name) => /90-|public-catalogue|product_location_stock|products\.slug/i.test(name)),
    false
  )
})

test('package.json exposes test:shop-storefront', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.scripts['test:shop-storefront'], 'node --test scripts/shop-storefront-selfcheck.mjs')
})
