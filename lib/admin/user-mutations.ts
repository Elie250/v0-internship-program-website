import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { resolvePermissions } from '@/lib/admin/permissions'
import type { AdminUserRole } from '@/lib/admin/user-roles'

export async function approveStaffAccountMutation(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { data: user, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('id, email, first_name, last_name, role, status')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !user) {
    return { success: false, error: fetchError?.message ?? 'User not found' }
  }

  if (user.status === 'active') {
    return { success: true }
  }

  const permissions = resolvePermissions(user.role, [])

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      status: 'active',
      permissions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  if (user.email) {
    try {
      const { sendStaffApprovedEmail } = await import('@/lib/email/notifications')
      const fullName =
        [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.email
      void sendStaffApprovedEmail({
        to: user.email,
        fullName,
        role: String(user.role),
      })
    } catch (emailError) {
      console.error('[approveStaffAccount] email failed:', emailError)
    }
  }

  return { success: true }
}

export async function updateUserStatusMutation(
  id: string,
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval'
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'active') {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('id', id)
      .maybeSingle()

    if (user && user.status !== 'active') {
      updates.permissions = resolvePermissions(user.role, [])
    }
  }

  const { error } = await supabaseAdmin.from('users').update(updates).eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteUserMutation(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { error } = await supabaseAdmin.from('users').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function resetUserPasswordMutation(
  id: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
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
}

export async function createUserMutation(input: {
  email: string
  firstName: string
  lastName: string
  password: string
  role: AdminUserRole
}): Promise<{ success: boolean; error?: string }> {
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
}

export async function updateUserMutation(input: {
  id: string
  email: string
  firstName: string
  lastName: string
  role: AdminUserRole
}): Promise<{ success: boolean; error?: string }> {
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
}
