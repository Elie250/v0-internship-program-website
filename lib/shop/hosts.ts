/**
 * Hosts that serve the Energy & Logics Shop Management Platform.
 * shop.energyandlogics.com is the staff portal (POS, inventory, sales).
 * The public customer storefront remains www.energyandlogics.com/shop.
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

/** True when the request is on the dedicated Shop management subdomain. */
export function isShopHost(hostHeader: string | null): boolean {
  const host = normalizeHostname(hostHeader)
  if (!host) return false
  if (getShopHosts().includes(host)) return true
  // Vercel preview: shop-*.vercel.app or shop.*.vercel.app
  if (host.startsWith('shop.') && host.endsWith('.vercel.app')) return true
  return false
}

/** Public origin for the Shop management portal (emails, redirects). */
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
 * Public customer catalog `/shop` is intentionally excluded.
 */
export const SHOP_PORTAL_PATH_PREFIXES = [
  '/manage',
  '/login',
  '/dashboard',
  '/pos',
  '/products',
  '/inventory',
  '/sales',
  '/settings',
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

/** Public customer storefront paths — stay on the main site, not the shop host. */
export function isPublicStorefrontPath(pathname: string): boolean {
  return pathname === '/shop' || pathname.startsWith('/shop/')
}

export { getMainSiteOrigin, normalizeHostname }
