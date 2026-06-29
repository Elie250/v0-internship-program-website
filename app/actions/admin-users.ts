'use server'

import { requireAdminPermission } from '@/app/actions/admin-context'
import { queryAdminUsers } from '@/lib/admin/data/users'
import { PERMISSIONS } from '@/lib/admin/permissions'
import type { AdminUserRecord, AdminUserRole } from '@/lib/admin/user-roles'
import {
  approveStaffAccountMutation,
  createUserMutation,
  deleteUserMutation,
  resetUserPasswordMutation,
  updateUserMutation,
  updateUserStatusMutation,
} from '@/lib/admin/user-mutations'

export async function listAdminUsers(filters?: {
  search?: string
  role?: string
  status?: string
}): Promise<{ success: boolean; users?: AdminUserRecord[]; error?: string }> {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_VIEW)
    const { users, error } = await queryAdminUsers(filters)
    if (error) return { success: false, error }
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
    return createUserMutation(input)
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
    return updateUserMutation(input)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user',
    }
  }
}

export async function updateAdminUserStatus(
  id: string,
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval'
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_ACTIVATE)
    return updateUserStatusMutation(id, status)
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
    return resetUserPasswordMutation(id, newPassword)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset password',
    }
  }
}

export async function approveStaffAccount(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_ACTIVATE)
    return approveStaffAccountMutation(id)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve account',
    }
  }
}

export async function deleteAdminUser(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_DELETE)
    return deleteUserMutation(id)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    }
  }
}
