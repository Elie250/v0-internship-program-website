'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

type AuthRole = 'student' | 'lecturer' | 'engineer' | 'admin'

async function verifyPassword(password: string, stored: string | null | undefined) {
  if (!stored) return false
  // bcrypt hash (same as registerUser / previous docs)
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    return bcrypt.compare(password, stored)
  }
  // legacy rows may store plain text in password_hash
  return password === stored
}

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: AuthRole
) {
  try {
    if (!supabaseAdmin) {
      return { success: false, error: 'Database not configured' }
    }

    const trimmedEmail = email.trim()

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('email', trimmedEmail)
      .maybeSingle()

    if (existingUser) {
      return { success: false, error: 'User already exists' }
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
      return { success: false, error: error.message }
    }

    return { success: true, user: newUser }
  } catch (error) {
    console.error('[v0] Registration error:', error)
    return { success: false, error: 'Registration failed' }
  }
}

export async function loginUser(email: string, password: string, role: AuthRole) {
  try {
    if (!supabaseAdmin) {
      return { success: false, error: 'Database not configured' }
    }

    const trimmedEmail = email.trim()

    // Same Supabase API pattern as apply/actions.ts and api/student-login
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .ilike('email', trimmedEmail)
      .eq('role', role)
      .maybeSingle()

    if (error) {
      console.error('[v0] Login query error:', error)
      return { success: false, error: error.message }
    }

    if (!user) {
      return {
        success: false,
        error: 'Invalid email, password, or role. Use eliebisamaza@gmail.com / admin123 / Administrator if seeded from docs.',
      }
    }

    if (user.status !== 'active') {
      return { success: false, error: 'Your account is not active' }
    }

    const passwordMatch = await verifyPassword(password, user.password_hash)
    if (!passwordMatch) {
      return { success: false, error: 'Invalid email or password' }
    }

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

    return { success: true, user }
  } catch (error) {
    console.error('[v0] Login error:', error)
    return { success: false, error: 'Login failed' }
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
    return { success: false, error: 'Logout failed' }
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
