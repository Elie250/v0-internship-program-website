import { cookies } from 'next/headers'
import { resolvePermissions } from '@/lib/admin/permissions'

export type EstablishSessionUser = {
  id: string
  email: string
  role: string
  first_name?: string | null
  last_name?: string | null
  permissions?: unknown
}

/**
 * Shared session cookie writer for Academy + Talent passwordless login.
 * Cookie remains host-only (no Domain=) — jobs.* and www.* sessions are separate
 * but resolve to the same users row by email.
 */
export async function establishUserSession(user: EstablishSessionUser) {
  const permissions = resolvePermissions(user.role, user.permissions)
  const cookieStore = await cookies()
  cookieStore.set(
    'user_session',
    JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      permissions,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    }
  )

  if (user.role === 'admin') {
    cookieStore.set('admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
  }
}
