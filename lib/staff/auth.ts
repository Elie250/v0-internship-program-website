import { createHash, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  canAccessAdminPanel,
  hasPermission,
  resolvePermissions,
  PERMISSIONS,
  type Permission,
} from '@/lib/admin/permissions'
import { isLoginAllowedStatus, loginBlockedMessage } from '@/lib/auth/staff-registration'

const STAFF_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14 // 14 days

export type StaffAuthUser = {
  id: string
  email: string
  role: string
  firstName: string
  lastName: string
  permissions: Permission[]
  canAccessAdmin: boolean
}

export type StaffSession = {
  sessionId: string
  token: string
  expiresAt: string
  user: StaffAuthUser
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function createRawToken(): string {
  return randomBytes(32).toString('base64url')
}

async function verifyPassword(password: string, stored: string | null | undefined) {
  if (!stored) return false
  // Only bcrypt hashes are accepted — plaintext comparison removed (Phase 1C hardening).
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    return bcrypt.compare(password, stored)
  }
  console.warn('[staff-auth] login rejected: password_hash is not bcrypt')
  return false
}

/** Exported for regression tests — does not reveal hash contents. */
export function isBcryptPasswordHash(stored: string | null | undefined): boolean {
  if (!stored) return false
  return (
    stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')
  )
}

function mapUser(row: {
  id: string
  email: string
  role: string
  first_name?: string | null
  last_name?: string | null
  permissions?: unknown
}): StaffAuthUser {
  const permissions = resolvePermissions(row.role, row.permissions)
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    permissions,
    canAccessAdmin: canAccessAdminPanel(row.role, permissions),
  }
}

function hasAnyShopStaffAccess(permissions: Permission[]): boolean {
  return hasPermission(permissions, [
    PERMISSIONS.SHOP_POS_SELL,
    PERMISSIONS.SHOP_SALES_VIEW,
    PERMISSIONS.SHOP_STOCK_VIEW,
    PERMISSIONS.SHOP_STOCK_ADJUST,
    PERMISSIONS.SHOP_ORDERS_VIEW,
    PERMISSIONS.SHOP_ORDERS_MANAGE,
    PERMISSIONS.SHOP_PRODUCTS,
    PERMISSIONS.SHOP_PRODUCTS_VIEW,
    PERMISSIONS.SHOP_ORDERS,
    PERMISSIONS.SHOP_CATEGORIES,
  ])
}

export async function createStaffSession(input: {
  email: string
  password: string
  userAgent?: string | null
}): Promise<{ session?: StaffSession; error?: string; httpStatus: number }> {
  if (!supabaseAdmin) {
    return { error: 'Database not configured', httpStatus: 500 }
  }

  const email = input.email.trim().toLowerCase()
  if (!email || !input.password) {
    return { error: 'Email and password are required', httpStatus: 400 }
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, role, first_name, last_name, permissions, status, password_hash')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    console.error('[staff-auth] user lookup failed')
    return { error: 'Unable to sign in', httpStatus: 500 }
  }
  if (!user) return { error: 'Invalid email or password', httpStatus: 401 }

  if (!isLoginAllowedStatus(user.status)) {
    return { error: loginBlockedMessage(user.status, user.role), httpStatus: 403 }
  }

  const ok = await verifyPassword(input.password, user.password_hash)
  if (!ok) return { error: 'Invalid email or password', httpStatus: 401 }

  const mapped = mapUser(user)
  if (!hasAnyShopStaffAccess(mapped.permissions) && mapped.role !== 'admin') {
    return {
      error: 'This account is not authorized for shop / POS access',
      httpStatus: 403,
    }
  }

  const token = createRawToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + STAFF_SESSION_TTL_MS).toISOString()

  const { data: sessionRow, error: sessionError } = await supabaseAdmin
    .from('staff_sessions')
    .insert([
      {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        last_used_at: new Date().toISOString(),
        user_agent: input.userAgent ?? null,
      },
    ])
    .select('id')
    .single()

  if (sessionError || !sessionRow) {
    console.error('[staff-auth] session create failed')
    return { error: 'Unable to sign in', httpStatus: 500 }
  }

  return {
    httpStatus: 200,
    session: {
      sessionId: sessionRow.id,
      token,
      expiresAt,
      user: mapped,
    },
  }
}

export async function getStaffSessionFromToken(
  token: string | null | undefined
): Promise<{ session?: { sessionId: string; user: StaffAuthUser }; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  if (!token?.trim()) return { error: 'Unauthorized' }

  const tokenHash = hashToken(token.trim())
  const now = new Date().toISOString()

  const { data: session, error } = await supabaseAdmin
    .from('staff_sessions')
    .select('id, user_id, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!session) return { error: 'Unauthorized' }
  if (session.revoked_at) return { error: 'Session revoked' }
  if (session.expires_at <= now) return { error: 'Session expired' }

  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email, role, first_name, last_name, permissions, status')
    .eq('id', session.user_id)
    .maybeSingle()

  if (userError || !user) return { error: 'Unauthorized' }
  if (!isLoginAllowedStatus(user.status)) return { error: 'Account not active' }

  await supabaseAdmin
    .from('staff_sessions')
    .update({ last_used_at: now })
    .eq('id', session.id)

  return {
    session: {
      sessionId: session.id,
      user: mapUser(user),
    },
  }
}

export async function revokeStaffSession(
  token: string | null | undefined
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }
  if (!token?.trim()) return { success: false, error: 'Unauthorized' }

  const tokenHash = hashToken(token.trim())
  const { error } = await supabaseAdmin
    .from('staff_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match?.[1]?.trim() || null
}
