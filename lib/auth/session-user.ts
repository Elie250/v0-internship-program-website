import { cookies } from 'next/headers'

export type SessionUser = {
  id: string
  email?: string
  role?: string
  firstName?: string
  lastName?: string
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export function displayNameFromSession(user: SessionUser | null): string {
  if (!user) return 'Anonymous'
  const first = String(user.firstName ?? '').trim()
  const last = String(user.lastName ?? '').trim()
  const full = [first, last].filter(Boolean).join(' ')
  if (full) return full
  if (user.email) return user.email.split('@')[0] ?? 'Member'
  return 'Member'
}
