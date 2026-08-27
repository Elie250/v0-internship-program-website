/**
 * Host-routing self-checks for Shop Management Platform (Phase 1C.1).
 * Run: pnpm test:shop-hosts
 *
 * Pure logic only — does not call live HTTP or Supabase.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

function normalizeHostname(hostHeader) {
  return (hostHeader ?? '').split(':')[0].trim().toLowerCase()
}

const DEFAULT_SHOP_HOSTS = ['shop.energyandlogics.com', 'shop.localhost']
const DEFAULT_RECRUITMENT_HOSTS = ['jobs.energyandlogics.com', 'jobs.localhost']

function getShopHosts(extraEnv) {
  const fromEnv = extraEnv
    ? extraEnv
        .split(',')
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean)
    : []
  return [...new Set([...DEFAULT_SHOP_HOSTS, ...fromEnv])]
}

function isShopHost(hostHeader, extraEnv) {
  const host = normalizeHostname(hostHeader)
  if (!host) return false
  if (getShopHosts(extraEnv).includes(host)) return true
  if (host.startsWith('shop.') && host.endsWith('.vercel.app')) return true
  return false
}

function isRecruitmentHost(hostHeader) {
  const host = normalizeHostname(hostHeader)
  if (!host) return false
  if (DEFAULT_RECRUITMENT_HOSTS.includes(host)) return true
  if (host.startsWith('jobs.') && host.endsWith('.vercel.app')) return true
  return false
}

const SHOP_PORTAL_PATH_PREFIXES = [
  '/manage',
  '/login',
  '/dashboard',
  '/pos',
  '/products',
  '/inventory',
  '/sales',
  '/orders',
  '/settings',
  '/users',
]

function isShopPortalPath(pathname) {
  return SHOP_PORTAL_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function isPublicStorefrontPath(pathname) {
  return pathname === '/shop' || pathname.startsWith('/shop/')
}

const SHOP_HOST_STOREFRONT_PATH_PREFIXES = [
  '/cart',
  '/checkout',
  '/track',
  '/product',
  '/order',
  '/storefront',
]

function isShopHostStorefrontPath(pathname) {
  return SHOP_HOST_STOREFRONT_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

const STOREFRONT_PUBLIC_MODULES = ['cart', 'checkout', 'track', 'product', 'order']

function rewriteShopStorefrontPath(pathname) {
  if (pathname === '/') return '/storefront'
  if (pathname === '/storefront' || pathname.startsWith('/storefront/')) return null
  for (const name of STOREFRONT_PUBLIC_MODULES) {
    if (pathname === `/${name}`) return `/storefront/${name}`
    if (pathname.startsWith(`/${name}/`)) {
      return `/storefront/${name}${pathname.slice(name.length + 1)}`
    }
  }
  return null
}

test('shop.energyandlogics.com is a Shop host', () => {
  assert.equal(isShopHost('shop.energyandlogics.com'), true)
  assert.equal(isShopHost('shop.energyandlogics.com:443'), true)
})

test('shop.localhost is a Shop host (local development)', () => {
  assert.equal(isShopHost('shop.localhost'), true)
  assert.equal(isShopHost('shop.localhost:3000'), true)
})

test('www.energyandlogics.com is not a Shop host', () => {
  assert.equal(isShopHost('www.energyandlogics.com'), false)
  assert.equal(isShopHost('energyandlogics.com'), false)
  assert.equal(isShopHost('localhost:3000'), false)
})

test('jobs.energyandlogics.com remains Talent, not Shop', () => {
  assert.equal(isRecruitmentHost('jobs.energyandlogics.com'), true)
  assert.equal(isShopHost('jobs.energyandlogics.com'), false)
  assert.equal(isShopHost('jobs.localhost'), false)
})

test('public /shop storefront path is not a shop portal path', () => {
  assert.equal(isPublicStorefrontPath('/shop'), true)
  assert.equal(isPublicStorefrontPath('/shop/abc'), true)
  assert.equal(isShopPortalPath('/shop'), false)
  assert.equal(isShopPortalPath('/manage'), true)
  assert.equal(isShopPortalPath('/pos'), true)
  assert.equal(isShopPortalPath('/dashboard'), true)
})

test('shop-host customer routes are public storefront, not staff portal', () => {
  assert.equal(isShopHostStorefrontPath('/cart'), true)
  assert.equal(isShopHostStorefrontPath('/checkout'), true)
  assert.equal(isShopHostStorefrontPath('/track'), true)
  assert.equal(isShopHostStorefrontPath('/product/relay'), true)
  assert.equal(isShopHostStorefrontPath('/order/EL-NYZ-20260827-0001'), true)
  assert.equal(isShopHostStorefrontPath('/storefront'), true)
  assert.equal(isShopPortalPath('/cart'), false)
  assert.equal(isShopPortalPath('/product'), false)
  assert.equal(isShopPortalPath('/product/relay'), false)
})

test('staff /products remains a portal path and is not /product', () => {
  assert.equal(isShopPortalPath('/products'), true)
  assert.equal(isShopPortalPath('/products/abc'), true)
  assert.equal(isShopHostStorefrontPath('/products'), false)
  assert.equal(isShopHostStorefrontPath('/products/abc'), false)
  assert.equal(isShopHostStorefrontPath('/product'), true)
})

test('shop-host public URLs rewrite to internal /storefront pages', () => {
  assert.equal(rewriteShopStorefrontPath('/'), '/storefront')
  assert.equal(rewriteShopStorefrontPath('/cart'), '/storefront/cart')
  assert.equal(rewriteShopStorefrontPath('/checkout'), '/storefront/checkout')
  assert.equal(rewriteShopStorefrontPath('/track'), '/storefront/track')
  assert.equal(rewriteShopStorefrontPath('/product/relay'), '/storefront/product/relay')
  assert.equal(rewriteShopStorefrontPath('/order/EL-NYZ-20260827-0001'), '/storefront/order/EL-NYZ-20260827-0001')
  assert.equal(rewriteShopStorefrontPath('/storefront'), null)
  assert.equal(rewriteShopStorefrontPath('/products'), null)
  assert.equal(rewriteShopStorefrontPath('/login'), null)
  assert.equal(rewriteShopStorefrontPath('/pos'), null)
  assert.equal(isShopPortalPath('/orders'), true)
  assert.equal(isShopPortalPath('/orders/abc'), true)
  assert.equal(isShopHostStorefrontPath('/orders'), false)
  assert.equal(isShopHostStorefrontPath('/order'), true)
  assert.equal(rewriteShopStorefrontPath('/orders'), null)
})

test('SHOP_HOSTS env can add extra hosts', () => {
  assert.equal(isShopHost('shop-staging.example.com', 'shop-staging.example.com'), true)
})

test('shop preview vercel hosts are recognized', () => {
  assert.equal(isShopHost('shop.my-app.vercel.app'), true)
})
