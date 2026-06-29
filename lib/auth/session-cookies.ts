import { cookies } from 'next/headers'

const SESSION_COOKIE = 'user_session'
const ADMIN_COOKIE = 'admin_session'

function clearCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  }
}

/** Clear auth cookies (must use same path/options as when they were set). */
export async function clearAuthCookies() {
  const cookieStore = await cookies()
  const opts = clearCookieOptions()
  cookieStore.set(SESSION_COOKIE, '', opts)
  cookieStore.set(ADMIN_COOKIE, '', opts)
}
