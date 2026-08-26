import { extractBearerToken } from '@/lib/staff/auth'
import { readStaffSessionCookieFromRequest } from '@/lib/staff/session-cookie'
import { isShopHost, normalizeHostname } from '@/lib/shop/hosts'

/**
 * Resolve staff token from Authorization Bearer (mobile) or httpOnly cookie (web).
 * Bearer takes precedence when both are present.
 */
export function extractStaffToken(request: Request): string | null {
  return extractBearerToken(request) || readStaffSessionCookieFromRequest(request)
}

/**
 * CSRF guard for cookie-authenticated mutating requests.
 * Bearer (mobile) requests are allowed without Origin checks.
 * Cookie sessions must be same-site / trusted shop origin.
 */
export function assertStaffMutationAllowed(request: Request): { ok: true } | { ok: false; error: string } {
  if (extractBearerToken(request)) {
    return { ok: true }
  }

  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  const secFetchSite = request.headers.get('sec-fetch-site')

  if (secFetchSite === 'same-origin' || secFetchSite === 'none') {
    return { ok: true }
  }

  if (!origin) {
    // Same-origin navigational POSTs sometimes omit Origin; require host match via Referer
    const referer = request.headers.get('referer')
    if (referer && host) {
      try {
        const refHost = normalizeHostname(new URL(referer).host)
        const reqHost = normalizeHostname(host)
        if (refHost === reqHost || isShopHost(refHost)) {
          return { ok: true }
        }
      } catch {
        /* fall through */
      }
    }
    return { ok: false, error: 'Missing request origin' }
  }

  try {
    const originHost = normalizeHostname(new URL(origin).host)
    const reqHost = normalizeHostname(host)
    if (originHost && (originHost === reqHost || isShopHost(originHost))) {
      return { ok: true }
    }
  } catch {
    return { ok: false, error: 'Invalid request origin' }
  }

  return { ok: false, error: 'Untrusted request origin' }
}
