'use server'

import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { resolvePermissions } from '@/lib/admin/permissions'

export type AdminUserRecord = {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  status: string
  permissions: string[]
  created_at: string
}

const USER_ROLES = [
  'student',
  'lecturer',
  'engineer',
  'mentor',
  'instructor',
  'support_staff',
  'admin',
] as const

export type AdminUserRole = (typeof USER_ROLES)[number]

export async function listAdminUsers(filters?: {
  search?: string
  role?: string
  status?: string
}): Promise<{ success: boolean; users?: AdminUserRecord[]; error?: string }> {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_VIEW)
    if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

    let query = supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role, status, permissions, created_at')
      .order('created_at', { ascending: false })

    if (filters?.role && filters.role !== 'all') {
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
    if (error) return { success: false, error: error.message }

    const users = (data ?? []).map((user) => ({
      ...user,
      permissions: resolvePermissions(user.role, user.permissions),
    }))

    return { success: true, users }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load users',
    }
  }
}

export async function createAdminUser(input: {
  email: string
  firstName: string
  lastName: string
  password: string
  role: AdminUserRole
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_CREATE)
    if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

    const email = input.email.trim()
    const passwordHash = await bcrypt.hash(input.password, 10)
    const permissions = resolvePermissions(input.role, [])

    const { error } = await supabaseAdmin.from('users').insert([
      {
        email,
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        password_hash: passwordHash,
        role: input.role,
        status: 'active',
        permissions,
      },
    ])

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    }
  }
}

export async function updateAdminUser(input: {
  id: string
  email: string
  firstName: string
  lastName: string
  role: AdminUserRole
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_EDIT)
    if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

    const permissions = resolvePermissions(input.role, [])

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        email: input.email.trim(),
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        role: input.role,
        permissions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user',
    }
  }
}

export async function updateAdminUserStatus(
  id: string,
  status: 'active' | 'inactive' | 'suspended'
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_ACTIVATE)
    if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    }
  }
}

export async function resetAdminUserPassword(
  id: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_EDIT)
    if (!supabaseAdmin) return { success: false, error: 'Database not configured' }
    if (newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    const { error } = await supabaseAdmin
      .from('users')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset password',
    }
  }
}

export async function deleteAdminUser(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_DELETE)
    if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

    const { error } = await supabaseAdmin.from('users').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    }
  }
}

export { USER_ROLES }
