'use server';

import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

// Get admin password from environment variables
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

export async function login(password: string) {
  try {
    if (!ADMIN_PASSWORD_HASH) {
      console.error('[v0] No ADMIN_PASSWORD_HASH configured');
      return { success: false, error: 'Admin password not configured' };
    }

    // For development/testing: if password matches the env var directly
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    if (adminPassword && password === adminPassword) {
      const cookieStore = await cookies();
      cookieStore.set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return { success: true };
    }

    // Try bcrypt comparison if hash is available
    const passwordMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!passwordMatch) {
      return { success: false, error: 'Invalid password' };
    }

    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return { success: true };
  } catch (error) {
    console.error('[v0] Login error:', error);
    return { success: false, error: 'An error occurred during login' };
  }
}

export async function logout() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
    return { success: true };
  } catch (error) {
    console.error('[v0] Logout error:', error);
    return { success: false, error: 'An error occurred during logout' };
  }
}

export async function checkAuth() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    return { isAuthenticated: !!session?.value };
  } catch (error) {
    console.error('[v0] Auth check error:', error);
    return { isAuthenticated: false };
  }
}
