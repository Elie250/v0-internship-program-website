/**
 * Android shop parity / production-readiness checks for Phase 1E.5-D.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mobile = join(root, 'apps', 'mobile')

function readMobile(rel) {
  return readFileSync(join(mobile, rel), 'utf8')
}

function needsShopPaymentReview(order) {
  if (order.paymentMethod === 'cash') return false
  const pending = ['pending_review', 'gateway_pending', 'pending', 'Pending']
  return pending.includes(String(order.paymentStatus ?? '')) || pending.includes(String(order.payment?.status ?? ''))
}

test('staff logout returns to the customer shop', () => {
  const settings = readMobile('app/staff/settings.tsx')
  const index = readMobile('app/index.tsx')
  const login = readMobile('app/login.tsx')
  assert.match(settings, /router\.replace\('\/customer'/)
  assert.match(index, /token && user/)
  assert.match(index, /\/staff/)
  assert.match(login, /Back to shop/)
  assert.match(login, /\/customer/)
})

test('pending shop payment review is not limited to channel=online', () => {
  const list = readMobile('app/staff/orders/index.tsx')
  const detail = readMobile('app/staff/orders/[id].tsx')
  const dash = readMobile('src/features/commerce/index.ts')
  assert.match(list, /needsShopPaymentReview/)
  assert.match(detail, /needsShopPaymentReview/)
  assert.doesNotMatch(list, /channel === 'online' && pending/)
  assert.doesNotMatch(dash, /channel: 'online'/)
  assert.match(dash, /payment_status: 'pending_review'/)
  assert.equal(
    needsShopPaymentReview({ channel: 'pos', paymentMethod: 'momo', paymentStatus: 'pending_review' }),
    true
  )
  assert.equal(
    needsShopPaymentReview({ channel: 'online', paymentMethod: 'momo', paymentStatus: 'pending_review' }),
    true
  )
  assert.equal(
    needsShopPaymentReview({ channel: 'pos', paymentMethod: 'cash', paymentStatus: 'paid' }),
    false
  )
})

test('home merchandising de-duplicates and only shows deals with a real discount', () => {
  const merch = readMobile('src/features/shop/merchandising.ts')
  const home = readMobile('app/customer/index.tsx')
  assert.match(merch, /hasRealDiscount/)
  assert.match(merch, /selectDealProducts/)
  assert.match(merch, /selectLatestProducts/)
  assert.match(merch, /moreInShop/)
  assert.match(home, /home.deals/)
  assert.match(home, /home.more/)
  assert.match(home, /latestCards/)
})

test('search idle state does not claim products were found', () => {
  const search = readMobile('app/customer/search.tsx')
  assert.match(search, /showResults/)
  assert.match(search, /catalogue.browseAll/)
  assert.match(search, /catalogue.searchHint/)
  assert.match(search, /params\.browse/)
})

test('release API host cannot become localhost or HTTP', () => {
  const config = readMobile('src/api/config.ts')
  const app = JSON.parse(readMobile('app.json'))
  assert.match(config, /PRODUCTION_API_BASE_URL = 'https:\/\/shop\.energyandlogics\.com'/)
  assert.match(config, /!raw\.startsWith\('https:\/\/'\)/)
  assert.equal(app.expo.extra.apiBaseUrl, 'https://shop.energyandlogics.com')
  assert.equal(app.expo.android.usesCleartextTraffic, false)
  assert.doesNotMatch(config, /SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY/)
})
