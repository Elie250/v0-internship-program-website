'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import {
  AuthDebugInfo,
  classifyPasswordHash,
  formatUnknownError,
  getSupabaseConfigStatus,
} from '@/lib/auth-debug'

type AuthRole = 'student' | 'lecturer' | 'engineer' | 'admin'

export type AuthResult = {
  success: boolean
  error?: string
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
    email: email.trim(),
    role,
    userFound: false,
  }
}

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: AuthRole
): Promise<AuthResult & { user?: unknown }> {
  const debug = baseDebug(email, role)
  try {
    if (!supabaseAdmin) {
      debug.step = 'supabase_not_configured'
      return {
        success: false,
        error: 'Database not configured — SUPABASE_SERVICE_ROLE_KEY missing in Vercel',
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
          first_name: firstName,
          last_name: lastName,
          role,
          status: 'active',
        },
      ])
      .select()
      .single()

    if (error) {
      debug.step = 'insert_failed'
      debug.dbError = error.message
      debug.dbCode = error.code
      return {
        success: false,
        error: `Registration failed: ${error.message}`,
        debug,
      }
    }

    debug.step = 'registration_success'
    return { success: true, user: newUser, debug: undefined }
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
        error: 'Database not configured — SUPABASE_SERVICE_ROLE_KEY missing in Vercel',
        debug,
      }
    }

    const trimmedEmail = email.trim()
    debug.step = 'query_user_by_email_and_role'

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .ilike('email', trimmedEmail)
      .eq('role', role)
      .maybeSingle()

    if (error) {
      debug.step = 'query_failed'
      debug.dbError = error.message
      debug.dbCode = error.code
      return {
        success: false,
        error: `Database query failed: ${error.message}${error.code ? ` (${error.code})` : ''}`,
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
    const cookieStore = await cookies()
    cookieStore.set(
      'user_session',
      JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
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

    debug.step = 'login_success'
    return { success: true, user, debug: undefined }
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

export async function checkUserPermission(userId: string, permission: string) {
  try {
    if (!supabaseAdmin) return false

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('permissions')
      .eq('id', userId)
      .single()

    if (!user) {
      return false
    }

    return user.permissions?.includes(permission) || false
  } catch (error) {
    console.error('[v0] Permission check error:', error)
    return false
  }
}
