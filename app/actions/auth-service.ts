'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

function getAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('Database not configured (missing SUPABASE_SERVICE_ROLE_KEY)');
  }
  return supabaseAdmin;
}

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: 'student' | 'lecturer' | 'engineer' | 'admin'
) {
  try {
    const supabase = getAdminClient();

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return { success: false, error: 'User already exists' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          role,
          status: 'active',
        },
      ])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: newUser };
  } catch (error) {
    console.error('[v0] Registration error:', error);
    return { success: false, error: 'Registration failed' };
  }
}

export async function loginUser(
  email: string,
  password: string,
  role: 'student' | 'lecturer' | 'engineer' | 'admin'
) {
  try {
    const supabase = getAdminClient();

    // Get user by email (service role — bypasses RLS; required for auth)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', role)
      .single();

    if (error || !user) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Check if user is active
    if (user.status !== 'active') {
      return { success: false, error: 'Your account is not active' };
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Create session
    const cookieStore = await cookies();
    cookieStore.set('user_session', JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return { success: true, user };
  } catch (error) {
    console.error('[v0] Login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('user_session');
    return { success: true };
  } catch (error) {
    console.error('[v0] Logout error:', error);
    return { success: false, error: 'Logout failed' };
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('user_session');
    
    if (!session?.value) {
      return null;
    }

    return JSON.parse(session.value);
  } catch (error) {
    console.error('[v0] Get current user error:', error);
    return null;
  }
}

export async function checkUserPermission(userId: string, permission: string) {
  try {
    const supabase = getAdminClient();

    const { data: user } = await supabase
      .from('users')
      .select('permissions')
      .eq('id', userId)
      .single();

    if (!user) {
      return false;
    }

    return user.permissions?.includes(permission) || false;
  } catch (error) {
    console.error('[v0] Permission check error:', error);
    return false;
  }
}
