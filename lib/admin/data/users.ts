import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { resolvePermissions } from '@/lib/admin/permissions'
import type { AdminUserRecord } from '@/lib/admin/user-roles'

export async function queryAdminUsers(filters?: {
  search?: string
  role?: string
  status?: string
}): Promise<{ users: AdminUserRecord[]; error?: string }> {
  if (!supabaseAdmin) {
    return { users: [], error: 'Database not configured' }
  }

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

  if (error?.message.includes('permissions')) {
    let fallbackQuery = supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role, status, created_at')
      .order('created_at', { ascending: false })

    if (filters?.role && filters.role !== 'all') {
      fallbackQuery = fallbackQuery.eq('role', filters.role)
    }
    if (filters?.status && filters.status !== 'all') {
      fallbackQuery = fallbackQuery.eq('status', filters.status)
    }
    if (filters?.search?.trim()) {
      const term = filters.search.trim()
      fallbackQuery = fallbackQuery.or(
        `email.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`
      )
    }

    const fallback = await fallbackQuery
    if (fallback.error) return { users: [], error: fallback.error.message }
    return {
      users: (fallback.data ?? []).map((user) => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        role: user.role,
        status: user.status ?? 'active',
        created_at: user.created_at,
        permissions: resolvePermissions(user.role, null),
      })),
    }
  }

  if (error) return { users: [], error: error.message }

  return {
    users: (data ?? []).map((user) => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      role: user.role,
      status: user.status ?? 'active',
      created_at: user.created_at,
      permissions: resolvePermissions(user.role, user.permissions),
    })),
  }
}
