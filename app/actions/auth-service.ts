'use server'

import { supabaseAdmin, supabaseAdminConfig } from '@/lib/supabaseAdmin'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import {
  AuthDebugInfo,
  classifyPasswordHash,
  formatUnknownError,
  getSupabaseConfigStatus,
} from '@/lib/auth-debug'
import { linkEnrollmentsToUser } from '@/lib/enrollment/link-user'
import { hasPermission, resolvePermissions, type Permission } from '@/lib/admin/permissions'

type AuthRole = 'student' | 'lecturer' | 'engineer' | 'admin'

export type AuthResult = {
  success: boolean
  error?: string
  redirectTo?: string
  debug?: AuthDebugInfo
}

async function verifyPassword(password: string, stored: string | null | undefined) {
  if (!stored) return false
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    return bcrypt.compare(password, stored)
  }
  return password === stored
}

function baseDebug(email: string, role: AuthRole): AuthDebugInfo {
  const config = getSupabaseConfigStatus()
  return {
    step: 'init',
    supabaseUrlSet: config.supabaseUrlSet,
    serviceRoleKeySet: config.serviceRoleKeySet,
    supabaseUrlValid: config.supabaseUrlValid,
    supabaseUrlIssue: config.supabaseUrlIssue,
    supabaseHostname: config.supabaseHostname,
    email: email.trim(),
    role,
    userFound: false,
  }
}

function supabaseNotConfiguredMessage(): string {
  const { urlSet, serviceRoleKeySet, urlValidation } = supabaseAdminConfig

  if (!urlSet) {
    return 'Database not configured — set NEXT_PUBLIC_SUPABASE_URL in Vercel (https://YOUR_PROJECT.supabase.co, no /rest/v1 path)'
  }
  if (!urlValidation.valid) {
    return `Invalid Supabase URL: ${urlValidation.issue}`
  }
  if (!serviceRoleKeySet) {
    return 'Database not configured — set SUPABASE_SERVICE_ROLE_KEY in Vercel'
  }
  return 'Database client could not be initialized'
}

function pgrst125Hint(): string {
  return ' Check NEXT_PUBLIC_SUPABASE_URL is exactly https://YOUR_PROJECT_REF.supabase.co (no trailing slash or /rest/v1). Then run scripts/00-create-users-table.sql and NOTIFY pgrst, \'reload schema\'; in Supabase SQL editor.'
}

function dashboardPathForRole(role: string): string {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'student' || role === 'registered') return '/student/dashboard'
  if (role === 'lecturer' || role === 'instructor') return '/lecturer/dashboard'
  if (role === 'engineer') return '/engineer/dashboard'
  return '/dashboard'
}

type SessionUser = {
  id: string
  email: string
  role: string
  first_name?: string | null
  last_name?: string | null
  permissions?: unknown
}

async function establishUserSession(user: SessionUser) {
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
    }
  )

  if (user.role === 'admin') {
    cookieStore.set('admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })
  }
}

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: AuthRole,
  phone?: string
): Promise<AuthResult & { user?: unknown }> {
  const debug = baseDebug(email, role)
  try {
    if (!supabaseAdmin) {
      debug.step = 'supabase_not_configured'
      return {
        success: false,
        error: supabaseNotConfiguredMessage(),
        debug,
      }
    }

    const trimmedEmail = email.trim()

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('email', trimmedEmail)
      .maybeSingle()

    if (existingUser) {
      debug.step = 'user_already_exists'
      return { success: false, error: 'User already exists', debug }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email: trimmedEmail,
          password_hash: passwordHash,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          role,
          status: 'active',
          phone: phone?.trim() || null,
        },
      ])
      .select('id, email, role, first_name, last_name, status, permissions')
      .single()

    if (error || !newUser) {
      debug.step = 'insert_failed'
      debug.dbError = error?.message
      debug.dbCode = error?.code
      return {
        success: false,
        error: `Registration failed: ${error?.message ?? 'Could not create user'}`,
        debug,
      }
    }

    debug.step = 'set_session_cookie'
    await establishUserSession(newUser)
    await linkEnrollmentsToUser(newUser.id, trimmedEmail)

    debug.step = 'registration_success'
    return {
      success: true,
      redirectTo: dashboardPathForRole(newUser.role),
      debug: undefined,
    }
  } catch (error) {
    debug.step = 'registration_exception'
    debug.exception = formatUnknownError(error)
    return {
      success: false,
      error: `Registration exception: ${formatUnknownError(error)}`,
      debug,
    }
  }
}

export async function loginUser(
  email: string,
  password: string,
  role: AuthRole
): Promise<AuthResult & { user?: unknown }> {
  const debug = baseDebug(email, role)
  try {
    if (!supabaseAdmin) {
      debug.step = 'supabase_not_configured'
      return {
        success: false,
        error: supabaseNotConfiguredMessage(),
        debug,
      }
    }

    const trimmedEmail = email.trim()
    debug.step = 'query_user_by_email_and_role'

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, first_name, last_name, status, password_hash, permissions')
      .ilike('email', trimmedEmail)
      .eq('role', role)
      .maybeSingle()

    if (error) {
      debug.step = 'query_failed'
      debug.dbError = error.message
      debug.dbCode = error.code
      const hint = error.code === 'PGRST125' ? pgrst125Hint() : ''
      return {
        success: false,
        error: `Database query failed: ${error.message}${error.code ? ` (${error.code})` : ''}${hint}`,
        debug,
      }
    }

    if (!user) {
      debug.step = 'user_not_found_for_email_and_role'
      const { data: sameEmailUsers } = await supabaseAdmin
        .from('users')
        .select('role, status, email')
        .ilike('email', trimmedEmail)

      debug.usersWithEmailCount = sameEmailUsers?.length ?? 0
      debug.rolesForEmail = sameEmailUsers?.map((u) => u.role) ?? []

      const roleHint =
        debug.rolesForEmail.length > 0
          ? ` Account exists with role(s): ${debug.rolesForEmail.join(', ')}. You selected "${role}".`
          : ' No user row found for this email in the users table.'

      return {
        success: false,
        error: `Login failed — wrong email, role, or user missing.${roleHint}`,
        debug,
      }
    }

    debug.userFound = true
    debug.userRole = user.role
    debug.userStatus = user.status
    debug.passwordFieldPresent = Boolean(user.password_hash)
    debug.passwordHashType = classifyPasswordHash(user.password_hash)

    if (user.status !== 'active') {
      debug.step = 'user_not_active'
      return {
        success: false,
        error: `Account status is "${user.status}" (must be active)`,
        debug,
      }
    }

    debug.step = 'verify_password'
    const passwordMatch = await verifyPassword(password, user.password_hash)
    debug.passwordMatch = passwordMatch

    if (!passwordMatch) {
      debug.step = 'password_mismatch'
      return {
        success: false,
        error: `Password incorrect (stored type: ${debug.passwordHashType}). Try admin123 for seeded admin.`,
        debug,
      }
    }

    debug.step = 'set_session_cookie'
    await establishUserSession(user)
    await linkEnrollmentsToUser(user.id, trimmedEmail)

    debug.step = 'login_success'
    return {
      success: true,
      redirectTo: dashboardPathForRole(user.role),
      debug: undefined,
    }
  } catch (error) {
    debug.step = 'login_exception'
    debug.exception = formatUnknownError(error)
    return {
      success: false,
      error: `Login exception: ${formatUnknownError(error)}`,
      debug,
    }
  }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('user_session')
    cookieStore.delete('admin_session')
    return { success: true }
  } catch (error) {
    console.error('[v0] Logout error:', error)
    return { success: false, error: formatUnknownError(error) }
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('user_session')

    if (!session?.value) {
      return null
    }

    return JSON.parse(session.value)
  } catch (error) {
    console.error('[v0] Get current user error:', error)
    return null
  }
}

export async function checkUserPermission(userId: string, permission: Permission) {
  try {
    if (!supabaseAdmin) return false

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role, permissions')
      .eq('id', userId)
      .single()

    if (!user) {
      return false
    }

    const permissions = resolvePermissions(user.role, user.permissions)
    return hasPermission(permissions, permission)
  } catch (error) {
    console.error('[v0] Permission check error:', error)
    return false
  }
}
