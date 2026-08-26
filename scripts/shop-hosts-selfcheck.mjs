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
  '/settings',
]

function isShopPortalPath(pathname) {
  return SHOP_PORTAL_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function isPublicStorefrontPath(pathname) {
  return pathname === '/shop' || pathname.startsWith('/shop/')
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

test('SHOP_HOSTS env can add extra hosts', () => {
  assert.equal(isShopHost('shop-staging.example.com', 'shop-staging.example.com'), true)
})

test('shop preview vercel hosts are recognized', () => {
  assert.equal(isShopHost('shop.my-app.vercel.app'), true)
})
