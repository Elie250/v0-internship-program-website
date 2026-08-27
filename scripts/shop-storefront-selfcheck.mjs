/**
 * Phase 1E.3.1 — public shop storefront shell self-checks.
 * Run: pnpm test:shop-storefront
 *
 * Source inspections only — no live HTTP, no Supabase, no commerce writes.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
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
  'lib/shop/storefront-shops.ts',
  'lib/shop/storefront-locale.ts',
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
    'lib/shop/storefront-shops.ts',
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
  assert.doesNotMatch(cart, /\/api\/shop\/orders|\/api\/staff\/pos\/sales/)
  const checkout = read('app/storefront/checkout/page.tsx')
  assert.match(checkout, /StorefrontComingSoon/)
  assert.doesNotMatch(checkout, /createCommerceSale/)
})

test('package.json exposes test:shop-storefront', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.scripts['test:shop-storefront'], 'node --test scripts/shop-storefront-selfcheck.mjs')
})
