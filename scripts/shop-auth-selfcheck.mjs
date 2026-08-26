/**
 * Shop staff web auth + safe-return-path self-checks (Phase 1C.3).
 * Run: pnpm test:shop-auth
 */
import assert from 'node:assert/strict'
import test from 'node:test'

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

function sanitizeShopReturnPath(value, fallback = '/dashboard') {
  if (!value || typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if (!trimmed.startsWith('/')) return fallback
  if (trimmed.startsWith('//')) return fallback
  if (trimmed.includes('\\') || trimmed.includes('@')) return fallback
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return fallback

  const pathOnly = trimmed.split('?')[0].split('#')[0]
  if (pathOnly === '/login' || pathOnly.startsWith('/login/')) return fallback
  if (!isShopPortalPath(pathOnly) && pathOnly !== '/manage' && !pathOnly.startsWith('/manage/')) {
    return fallback
  }
  return trimmed
}

function extractBearerToken(header) {
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match?.[1]?.trim() || null
}

function readStaffSessionCookieFromHeader(cookieHeader) {
  const match = (cookieHeader || '').match(/(?:^|;\s*)staff_session=([^;]+)/)
  if (!match?.[1]) return null
  try {
    return decodeURIComponent(match[1].trim()) || null
  } catch {
    return match[1].trim() || null
  }
}

function extractStaffToken({ authorization, cookie }) {
  return extractBearerToken(authorization) || readStaffSessionCookieFromHeader(cookie)
}

test('sanitizeShopReturnPath allows internal shop portal paths', () => {
  assert.equal(sanitizeShopReturnPath('/pos'), '/pos')
  assert.equal(sanitizeShopReturnPath('/products/abc'), '/products/abc')
  assert.equal(sanitizeShopReturnPath('/dashboard?x=1'), '/dashboard?x=1')
})

test('sanitizeShopReturnPath blocks open redirects', () => {
  assert.equal(sanitizeShopReturnPath('https://evil.example'), '/dashboard')
  assert.equal(sanitizeShopReturnPath('//evil.example'), '/dashboard')
  assert.equal(sanitizeShopReturnPath('/\\evil'), '/dashboard')
  assert.equal(sanitizeShopReturnPath('/login'), '/dashboard')
  assert.equal(sanitizeShopReturnPath('/student/dashboard'), '/dashboard')
})

test('Bearer token takes precedence over cookie', () => {
  const token = extractStaffToken({
    authorization: 'Bearer mobile-token',
    cookie: 'staff_session=web-token',
  })
  assert.equal(token, 'mobile-token')
})

test('cookie token is used when Bearer is absent', () => {
  const token = extractStaffToken({
    authorization: null,
    cookie: 'staff_session=web-token; other=1',
  })
  assert.equal(token, 'web-token')
})

test('missing credentials yield null token', () => {
  assert.equal(extractStaffToken({ authorization: null, cookie: '' }), null)
})
