import { isShopPortalPath } from '@/lib/shop/hosts'

/**
 * Only allow relative Shop portal paths as post-login return targets.
 * Prevents open redirects to external URLs.
 */
export function sanitizeShopReturnPath(
  value: string | null | undefined,
  fallback = '/dashboard'
): string {
  if (!value || typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if (!trimmed.startsWith('/')) return fallback
  if (trimmed.startsWith('//')) return fallback
  if (trimmed.includes('\\') || trimmed.includes('@')) return fallback
  // Block protocol-relative and absolute URLs disguised in query
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return fallback

  const pathOnly = trimmed.split('?')[0].split('#')[0]
  if (pathOnly === '/login' || pathOnly.startsWith('/login/')) return fallback
  if (!isShopPortalPath(pathOnly) && pathOnly !== '/manage' && !pathOnly.startsWith('/manage/')) {
    return fallback
  }
  return trimmed
}
