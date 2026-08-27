/**
 * Shop Staff Management (Phase 1D) — admin-only operations on existing users + staff_sessions.
 * Reuses bcrypt hashing and resolvePermissions; does not invent a second auth system.
 */
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  extrasToPreserveOnRoleChange,
  getPermissionsForRole,
  resolvePermissions,
  type Permission,
} from '@/lib/admin/permissions'
import { isBcryptPasswordHash, revokeAllStaffSessionsForUser } from '@/lib/staff/auth'

export const SHOP_STAFF_ROLES = ['salesperson', 'inventory_manager'] as const
export type ShopStaffRole = (typeof SHOP_STAFF_ROLES)[number]

export const SHOP_STAFF_LIST_ROLES = ['salesperson', 'inventory_manager', 'admin'] as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 6

export type ShopStaffUserDto = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  /** Effective permissions from role — never client-supplied. */
  permissions: Permission[]
  createdAt: string | null
  lastStaffSessionAt: string | null
  activeStaffSessionCount: number
}

export function isShopStaffRole(value: unknown): value is ShopStaffRole {
  return typeof value === 'string' && (SHOP_STAFF_ROLES as readonly string[]).includes(value)
}

export function normalizeStaffEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function validateStaffEmail(email: string): string | null {
  const normalized = normalizeStaffEmail(email)
  if (!normalized) return 'Email is required'
  if (!EMAIL_RE.test(normalized)) return 'Invalid email address'
  return null
}

export function validateStaffPassword(password: string): string | null {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  }
  return null
}

function mapStaffRow(
  row: {
    id: string
    email: string
    first_name?: string | null
    last_name?: string | null
    role: string
    status?: string | null
    created_at?: string | null
  },
  sessionMeta?: { lastStaffSessionAt: string | null; activeStaffSessionCount: number }
): ShopStaffUserDto {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    role: row.role,
    status: row.status ?? 'active',
    permissions: resolvePermissions(row.role, []),
    createdAt: row.created_at ?? null,
    lastStaffSessionAt: sessionMeta?.lastStaffSessionAt ?? null,
    activeStaffSessionCount: sessionMeta?.activeStaffSessionCount ?? 0,
  }
}

function safeDbError(message: string | null | undefined, fallback: string): string {
  const raw = String(message ?? '')
  if (/duplicate|unique|already exists/i.test(raw)) return 'An account with this email already exists'
  if (/users_role_check|role/i.test(raw) && /violat/i.test(raw)) return 'Invalid staff role'
  return fallback
}

async function countActiveAdmins(excludeUserId?: string): Promise<number> {
  if (!supabaseAdmin) return 0
  let query = supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin')
    .eq('status', 'active')

  if (excludeUserId) {
    query = query.neq('id', excludeUserId)
  }

  const { count } = await query
  return count ?? 0
}

async function loadSessionMeta(
  userIds: string[]
): Promise<Map<string, { lastStaffSessionAt: string | null; activeStaffSessionCount: number }>> {
  const map = new Map<
    string,
    { lastStaffSessionAt: string | null; activeStaffSessionCount: number }
  >()
  for (const id of userIds) {
    map.set(id, { lastStaffSessionAt: null, activeStaffSessionCount: 0 })
  }
  if (!supabaseAdmin || userIds.length === 0) return map

  const { data, error } = await supabaseAdmin
    .from('staff_sessions')
    .select('user_id, last_used_at, created_at, revoked_at, expires_at')
    .in('user_id', userIds)
    .order('created_at', { ascending: false })

  if (error || !data) return map

  const now = Date.now()
  for (const row of data) {
    const userId = String(row.user_id)
    const entry = map.get(userId) ?? {
      lastStaffSessionAt: null,
      activeStaffSessionCount: 0,
    }
    const activity = row.last_used_at || row.created_at
    if (activity) {
      if (
        !entry.lastStaffSessionAt ||
        new Date(activity).getTime() > new Date(entry.lastStaffSessionAt).getTime()
      ) {
        entry.lastStaffSessionAt = String(activity)
      }
    }
    const active =
      !row.revoked_at &&
      row.expires_at &&
      new Date(String(row.expires_at)).getTime() > now
    if (active) entry.activeStaffSessionCount += 1
    map.set(userId, entry)
  }
  return map
}

export async function listShopStaffUsers(filters?: {
  search?: string
  role?: string
  status?: string
}): Promise<{ users: ShopStaffUserDto[]; error?: string; httpStatus: number }> {
  if (!supabaseAdmin) {
    return { users: [], error: 'Database not configured', httpStatus: 500 }
  }

  let query = supabaseAdmin
    .from('users')
    .select('id, email, first_name, last_name, role, status, created_at')
    .in('role', [...SHOP_STAFF_LIST_ROLES])
    .order('created_at', { ascending: false })

  if (filters?.role && filters.role !== 'all') {
    if (!(SHOP_STAFF_LIST_ROLES as readonly string[]).includes(filters.role)) {
      return { users: [], error: 'Invalid role filter', httpStatus: 400 }
    }
    query = query.eq('role', filters.role)
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.search?.trim()) {
    const term = filters.search.trim()
    query = query.or(
      `email.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`
    )
  }

  const { data, error } = await query
  if (error) {
    return {
      users: [],
      error: safeDbError(error.message, 'Failed to load staff'),
      httpStatus: 500,
    }
  }

  const rows = data ?? []
  const meta = await loadSessionMeta(rows.map((r) => r.id))
  return {
    httpStatus: 200,
    users: rows.map((row) => mapStaffRow(row, meta.get(row.id))),
  }
}

export async function getShopStaffUser(
  id: string
): Promise<{ user?: ShopStaffUserDto; error?: string; httpStatus: number }> {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 }
  if (!id?.trim()) return { error: 'User id required', httpStatus: 400 }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, first_name, last_name, role, status, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return { error: safeDbError(error.message, 'Failed to load staff member'), httpStatus: 500 }
  }
  if (!data) return { error: 'Staff member not found', httpStatus: 404 }
  if (!(SHOP_STAFF_LIST_ROLES as readonly string[]).includes(data.role)) {
    return { error: 'Staff member not found', httpStatus: 404 }
  }

  const meta = await loadSessionMeta([data.id])
  return { httpStatus: 200, user: mapStaffRow(data, meta.get(data.id)) }
}

export async function createShopStaffUser(input: {
  email: string
  firstName: string
  lastName: string
  password: string
  role: unknown
  /** Ignored — permissions always come from role. */
  permissions?: unknown
}): Promise<{ user?: ShopStaffUserDto; error?: string; httpStatus: number }> {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 }

  const emailError = validateStaffEmail(input.email)
  if (emailError) return { error: emailError, httpStatus: 400 }

  const passwordError = validateStaffPassword(input.password)
  if (passwordError) return { error: passwordError, httpStatus: 400 }

  if (!isShopStaffRole(input.role)) {
    return {
      error: 'Role must be salesperson or inventory_manager',
      httpStatus: 400,
    }
  }

  const email = normalizeStaffEmail(input.email)
  const firstName = String(input.firstName ?? '').trim()
  const lastName = String(input.lastName ?? '').trim()
  if (!firstName && !lastName) {
    return { error: 'Full name is required', httpStatus: 400 }
  }

  const passwordHash = await bcrypt.hash(input.password, 10)
  if (!isBcryptPasswordHash(passwordHash)) {
    return { error: 'Unable to create staff account', httpStatus: 500 }
  }

  const permissions = getPermissionsForRole(input.role)

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert([
      {
        email,
        first_name: firstName || lastName,
        last_name: lastName,
        password_hash: passwordHash,
        role: input.role,
        status: 'active',
        permissions,
      },
    ])
    .select('id, email, first_name, last_name, role, status, created_at')
    .single()

  if (error || !data) {
    return {
      error: safeDbError(error?.message, 'Unable to create staff account'),
      httpStatus: 400,
    }
  }

  return { httpStatus: 201, user: mapStaffRow(data) }
}

export async function updateShopStaffUser(input: {
  id: string
  actorUserId: string
  email?: string
  firstName?: string
  lastName?: string
  role?: unknown
  status?: 'active' | 'inactive' | 'suspended'
  /** Ignored. */
  permissions?: unknown
}): Promise<{ user?: ShopStaffUserDto; error?: string; httpStatus: number }> {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 }

  const existing = await getShopStaffUser(input.id)
  if (!existing.user) {
    return { error: existing.error, httpStatus: existing.httpStatus }
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.email !== undefined) {
    const emailError = validateStaffEmail(input.email)
    if (emailError) return { error: emailError, httpStatus: 400 }
    updates.email = normalizeStaffEmail(input.email)
  }
  if (input.firstName !== undefined) updates.first_name = String(input.firstName).trim()
  if (input.lastName !== undefined) updates.last_name = String(input.lastName).trim()

  let nextRole = existing.user.role
  if (input.role !== undefined) {
    if (String(input.role).toLowerCase() === 'admin') {
      return { error: 'Cannot assign administrator role from Shop staff management', httpStatus: 400 }
    }
    if (!isShopStaffRole(input.role)) {
      return { error: 'Role must be salesperson or inventory_manager', httpStatus: 400 }
    }
    if (existing.user.role === 'admin') {
      if (input.actorUserId === input.id) {
        return { error: 'You cannot remove your own administrator role', httpStatus: 400 }
      }
      const remaining = await countActiveAdmins(input.id)
      if (remaining < 1 && existing.user.status === 'active') {
        return {
          error: 'Cannot demote the final active administrator',
          httpStatus: 400,
        }
      }
    }
    nextRole = input.role
    updates.role = input.role
    const { data: storedRow } = await supabaseAdmin
      .from('users')
      .select('permissions')
      .eq('id', input.id)
      .maybeSingle()
    updates.permissions = extrasToPreserveOnRoleChange(storedRow?.permissions, nextRole)
  }

  if (input.status !== undefined) {
    if (!['active', 'inactive', 'suspended'].includes(input.status)) {
      return { error: 'Invalid status', httpStatus: 400 }
    }
    if (
      existing.user.role === 'admin' &&
      existing.user.status === 'active' &&
      input.status !== 'active'
    ) {
      if (input.actorUserId === input.id) {
        return { error: 'You cannot deactivate your own administrator account', httpStatus: 400 }
      }
      const remaining = await countActiveAdmins(input.id)
      if (remaining < 1) {
        return {
          error: 'Cannot deactivate the final active administrator',
          httpStatus: 400,
        }
      }
    }
    updates.status = input.status
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', input.id)
    .select('id, email, first_name, last_name, role, status, created_at')
    .single()

  if (error || !data) {
    return {
      error: safeDbError(error?.message, 'Unable to update staff member'),
      httpStatus: 400,
    }
  }

  const deactivated =
    input.status !== undefined &&
    input.status !== 'active' &&
    existing.user.status === 'active'

  if (deactivated) {
    await revokeAllStaffSessionsForUser(input.id)
  }

  const meta = await loadSessionMeta([data.id])
  return { httpStatus: 200, user: mapStaffRow(data, meta.get(data.id)) }
}

export async function resetShopStaffPassword(input: {
  id: string
  newPassword: string
}): Promise<{ success?: boolean; error?: string; httpStatus: number }> {
  if (!supabaseAdmin) return { error: 'Database not configured', httpStatus: 500 }

  const existing = await getShopStaffUser(input.id)
  if (!existing.user) {
    return { error: existing.error, httpStatus: existing.httpStatus }
  }

  const passwordError = validateStaffPassword(input.newPassword)
  if (passwordError) return { error: passwordError, httpStatus: 400 }

  const passwordHash = await bcrypt.hash(input.newPassword, 10)
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      password_hash: passwordHash,
      password_reset_token: null,
      password_reset_expires: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)

  if (error) {
    return {
      error: safeDbError(error.message, 'Unable to reset password'),
      httpStatus: 400,
    }
  }

  await revokeAllStaffSessionsForUser(input.id)
  return { success: true, httpStatus: 200 }
}

export async function revokeShopStaffSessions(
  id: string
): Promise<{ success?: boolean; revokedCount?: number; error?: string; httpStatus: number }> {
  const existing = await getShopStaffUser(id)
  if (!existing.user) {
    return { error: existing.error, httpStatus: existing.httpStatus }
  }

  const result = await revokeAllStaffSessionsForUser(id)
  if (!result.success) {
    return {
      error: safeDbError(result.error, 'Unable to revoke sessions'),
      httpStatus: 500,
    }
  }
  return { success: true, revokedCount: result.revokedCount, httpStatus: 200 }
}

/** Pure helpers exported for self-checks (no secrets). */
export function shopStaffCreateRejectsAdminRole(role: unknown): boolean {
  return !isShopStaffRole(role)
}

export function shopStaffIgnoresClientPermissions(
  clientPermissions: unknown,
  role: ShopStaffRole
): Permission[] {
  void clientPermissions
  return getPermissionsForRole(role)
}

/** Name/status updates must not rewrite users.permissions. Role changes keep shop extras. */
export function shopStaffUpdateTouchesPermissions(fields: {
  email?: unknown
  firstName?: unknown
  lastName?: unknown
  role?: unknown
  status?: unknown
}): boolean {
  return fields.role !== undefined
}
