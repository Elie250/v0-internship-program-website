import { cookies } from 'next/headers'

/** httpOnly cookie holding the staff session token (same token as Bearer for mobile). */
export const STAFF_SESSION_COOKIE = 'staff_session'

const STAFF_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 14 // 14 days — matches staff_sessions TTL

export function staffSessionCookieOptions(maxAge = STAFF_SESSION_MAX_AGE_SEC) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

export async function setStaffSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(STAFF_SESSION_COOKIE, token, staffSessionCookieOptions())
}

export async function clearStaffSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.set(STAFF_SESSION_COOKIE, '', staffSessionCookieOptions(0))
}

export async function readStaffSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get(STAFF_SESSION_COOKIE)?.value?.trim()
  return value || null
}

export function readStaffSessionCookieFromRequest(request: Request): string | null {
  const header = request.headers.get('cookie') || ''
  const match = header.match(/(?:^|;\s*)staff_session=([^;]+)/)
  if (!match?.[1]) return null
  try {
    return decodeURIComponent(match[1].trim()) || null
  } catch {
    return match[1].trim() || null
  }
}
