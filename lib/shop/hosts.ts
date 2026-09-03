/**
 * Hosts that serve the Energy & Logics Shop.
 * shop.energyandlogics.com is the public customer storefront; staff live under /manage
 * (and short aliases such as /pos). The Academy catalog at www.energyandlogics.com/shop
 * remains on the main site.
 */
import { getMainSiteOrigin, normalizeHostname } from '@/lib/recruitment/hosts'

const DEFAULT_SHOP_HOSTS = ['shop.energyandlogics.com', 'shop.localhost']

export function getShopHosts(): string[] {
  const extra = process.env.SHOP_HOSTS?.trim()
  const fromEnv = extra
    ? extra
        .split(',')
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean)
    : []
  return [...new Set([...DEFAULT_SHOP_HOSTS, ...fromEnv])]
}

/** True when the request is on the dedicated Shop subdomain. */
export function isShopHost(hostHeader: string | null): boolean {
  const host = normalizeHostname(hostHeader)
  if (!host) return false
  if (getShopHosts().includes(host)) return true
  // Vercel preview: shop-*.vercel.app or shop.*.vercel.app
  if (host.startsWith('shop.') && host.endsWith('.vercel.app')) return true
  return false
}

/** Public origin for the Shop host (storefront, emails, redirects). */
export function getShopPublicOrigin(): string {
  const url =
    process.env.SHOP_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SHOP_URL?.trim() ||
    'https://shop.energyandlogics.com'
  return url.replace(/\/$/, '')
}

/**
 * Path prefixes that belong to the Shop management portal on the shop host.
 * These must NOT be redirected to the main Academy site when on shop.*.
 * Academy catalog `/shop` and customer storefront routes are excluded.
 */
export const SHOP_PORTAL_PATH_PREFIXES = [
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
] as const

export function isShopPortalPath(pathname: string): boolean {
  return SHOP_PORTAL_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

/** Staff commerce APIs used by the Shop portal (and future Android POS). */
export function isShopStaffApiPath(pathname: string): boolean {
  return pathname === '/api/staff' || pathname.startsWith('/api/staff/')
}

/**
 * Academy catalog on the main site. On the shop host these still redirect to www.
 * Do not confuse with shop-host customer routes (`/`, `/cart`, `/product`, …).
 */
export function isPublicStorefrontPath(pathname: string): boolean {
  return pathname === '/shop' || pathname.startsWith('/shop/')
}

/**
 * Customer storefront paths on the shop host (public, no staff session).
 * `/` is handled separately so Talent `/` is not treated as a shop route.
 * `/products` (staff) is not included — only singular `/product`.
 */
export const SHOP_HOST_STOREFRONT_PATH_PREFIXES = [
  '/cart',
  '/checkout',
  '/track',
  '/product',
  '/order',
  '/storefront',
] as const

export function isShopHostStorefrontPath(pathname: string): boolean {
  return SHOP_HOST_STOREFRONT_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

const STOREFRONT_PUBLIC_MODULES = ['cart', 'checkout', 'track', 'product', 'order'] as const

/**
 * Map public shop-host URLs to internal `/storefront/*` App Router pages.
 * Returns null when the path is already internal or is not a customer route.
 */
export function rewriteShopStorefrontPath(pathname: string): string | null {
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

export { getMainSiteOrigin, normalizeHostname }
