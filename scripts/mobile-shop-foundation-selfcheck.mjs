/**
 * Android shop foundation: customer + staff separation.
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

test('customer catalogue uses the public shop API and never staff products', () => {
  const publicApi = readMobile('src/api/public.ts')
  const catalogue = readRoot('app/api/shop/catalogue/route.ts')
  const detail = readRoot('app/api/shop/catalogue/[slug]/route.ts')
  const home = readMobile('app/customer/index.tsx')
  const hero = readMobile('src/features/shop/HeroBanner.tsx')
  const client = readMobile('src/api/client.ts')
  const config = readMobile('src/api/config.ts')

  assert.match(catalogue, /loadPublicCatalogue/)
  assert.match(detail, /getPublicCatalogueItemBySlug/)
  assert.match(publicApi, /\/api\/shop\/catalogue/)
  assert.match(publicApi, /publicRequest/)
  assert.match(publicApi, /parsePublicCatalogue/)
  assert.match(home, /usePublicCatalogue/)
  assert.match(home, /selectHeroSlides/)
  assert.match(home, /heroSlides/)
  assert.match(hero, /cube-outline/)
  assert.doesNotMatch(home, /arduino|fanta-78cb804b/i)
  assert.doesNotMatch(hero, /arduino|fanta-78cb804b/i)
  assert.match(home, /catalogueErrorKey/)
  assert.doesNotMatch(home, /\/api\/staff\/products/)
  assert.doesNotMatch(home, /t\('catalogue.error'\)/)
  assert.match(client, /export async function publicRequest/)
  assert.match(client, /useAuth && token/)
  assert.match(config, /PRODUCTION_API_BASE_URL = 'https:\/\/shop\.energyandlogics\.com'/)
  assert.match(config, /isLocalDevApiHost/)
  assert.doesNotMatch(catalogue, /costPrice|cost_price|service.role/i)
  assert.doesNotMatch(detail, /costPrice|cost_price/)
})

test('customer and staff routes stay separated', () => {
  const index = readMobile('app/index.tsx')
  const customer = readMobile('app/customer/_layout.tsx')
  const staff = readMobile('app/staff/_layout.tsx')
  const login = readMobile('app/login.tsx')
  assert.match(index, /\/customer/)
  assert.match(customer, /name="index"/)
  assert.match(customer, /name="categories"/)
  assert.match(customer, /name="search"/)
  assert.match(customer, /name="cart"/)
  assert.match(staff, /Redirect href="\/login"/)
  assert.match(login, /\/api\/staff\/auth|loginStaff|signIn/)
  assert.doesNotMatch(customer, /shop:payments_review|Approve MoMo/)
})

test('EN/RW language architecture is centralized and persisted', () => {
  const en = readMobile('src/i18n/messages/en.ts')
  const rw = readMobile('src/i18n/messages/rw.ts')
  const store = readMobile('src/i18n/locale-store.ts')
  const language = readMobile('app/customer/language.tsx')
  assert.match(en, /brand.name/)
  assert.match(rw, /Ikinyarwanda/)
  assert.match(store, /el.customer.locale/)
  assert.match(store, /ShopLocale = 'en' \| 'rw'/)
  assert.match(language, /setLocale/)
  assert.doesNotMatch(language, /English[\s\S]*Kinyarwanda[\s\S]*English/)
})

test('customer cart is local selling-unit quantity and does not own checkout', () => {
  const cart = readMobile('src/features/shop/cart-store.ts')
  const rules = readMobile('src/features/shop/cart-rules.ts')
  const screen = readMobile('app/customer/cart.tsx')
  assert.match(rules, /quantity: number/)
  assert.match(rules, /sellingUnitLabel/)
  assert.match(rules, /slug:/)
  assert.match(cart, /maxQuantity/)
  assert.match(cart, /hydrate/)
  assert.doesNotMatch(cart, /createCommerceSale|\/api\/shop\/orders/)
  assert.match(screen, /\/customer\/checkout/)
  assert.doesNotMatch(screen, /createCommerceSale|submitSale/)
})

test('release API base URL cannot silently become localhost', () => {
  const config = readMobile('src/api/config.ts')
  const eas = JSON.parse(readMobile('eas.json'))
  assert.match(config, /!input\.isDev/)
  assert.match(config, /isLocalDevApiHost/)
  assert.equal(
    eas.build.production.env.EXPO_PUBLIC_API_BASE_URL,
    'https://shop.energyandlogics.com'
  )
  assert.doesNotMatch(config, /SUPABASE_SERVICE_ROLE|localhost:3000/)
})

test('catalogue errors distinguish network from HTTP failures', () => {
  const helper = readMobile('src/features/shop/catalogue-error.ts')
  const client = readMobile('src/api/client.ts')
  const publicApi = readMobile('src/api/public.ts')
  assert.match(helper, /code === 'network'/)
  assert.match(helper, /code === 'timeout'/)
  assert.match(helper, /not_found/)
  assert.match(helper, /catalogue.unavailableShop/)
  assert.match(client, /invalid_json/)
  assert.match(client, /\[el-api\]/)
  assert.match(publicApi, /invalid_payload/)
  assert.match(publicApi, /throw payloadError/)
})

test('home hero uses the public catalogue image and search hides counts until a query', () => {
  const home = readMobile('app/customer/index.tsx')
  const search = readMobile('app/customer/search.tsx')
  const merch = readMobile('src/features/shop/merchandising.ts')
  const hero = readMobile('src/features/shop/HeroBanner.tsx')
  const en = readMobile('src/i18n/messages/en.ts')
  const rw = readMobile('src/i18n/messages/rw.ts')

  assert.match(merch, /export function selectHeroSlides/)
  assert.match(merch, /latest\.filter/)
  assert.doesNotMatch(merch, /selectHeroProduct/)
  assert.match(home, /selectHeroSlides\(latest\)/)
  assert.match(hero, /source=\{\{ uri: current\.image \}\}/)
  assert.match(hero, /contentPosition="right"/)
  assert.match(hero, /numberOfLines=\{1\}/)
  assert.match(hero, /hero-fade\.png/)
  assert.match(hero, /Animated\.timing/)
  assert.doesNotMatch(hero, /heroBlendStop|HERO_BLEND/)
  assert.match(search, /const activeQuery = q\.trim\(\)/)
  assert.match(search, /params\.category/)
  assert.match(search, /item\.categorySlug === category/)
  assert.match(search, /browsingCategory/)
  assert.match(search, /catalogue.searchHint/)
  assert.match(search, /catalogue.resultsNone/)
  assert.match(search, /catalogue.resultsOne/)
  assert.match(search, /catalogue.resultsMany/)
  assert.doesNotMatch(search, /catalogue.results'/)
  assert.match(en, /Search for products/)
  assert.match(en, /\{n\} products found/)
  assert.match(rw, /Shakisha ibicuruzwa/)
})

test('mobile app never embeds service-role or duplicate commerce', () => {
  const sources = walk(mobile)
    .filter((file) => ['.ts', '.tsx', '.json', '.env'].includes(extname(file)) || file.endsWith('.env.example'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  assert.doesNotMatch(sources, /SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY/)
  assert.doesNotMatch(sources, /createCommerceSale\(/)
  assert.match(readMobile('src/features/devices/index.ts'), /DEVICE_CONTROL_ENABLED = false/)
})
